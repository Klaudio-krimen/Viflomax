import os
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'viflomax_key_2026')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///viflomax_sap.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# --- MODELOS ---
class Usuario(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), default='trabajador')

class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    direccion = db.Column(db.String(200))
    sector = db.Column(db.String(50))
    telefono = db.Column(db.String(20))
    envases_prestados = db.Column(db.Integer, default=0)
    ultima_compra = db.Column(db.DateTime, default=datetime.utcnow)

class Transaccion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20))
    descripcion = db.Column(db.String(100))
    monto = db.Column(db.Integer)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(uid): return Usuario.query.get(int(uid))

# --- INICIALIZACIÓN ---
with app.app_context():
    db.create_all()
    if not Usuario.query.filter_by(username='claudio').first():
        db.session.add(Usuario(username='claudio', password=generate_password_hash('viflomax2026'), rol='admin'))
        db.session.commit()

# --- RUTAS DE ACCESO ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        u = Usuario.query.filter_by(username=request.form['username']).first()
        if u and check_password_hash(u.password, request.form['password']):
            login_user(u)
            return redirect(url_for('dashboard'))
        flash('Credenciales incorrectas')
    return render_template('login.html')

@app.route('/')
@login_required
def dashboard(): return render_template('dashboard.html')

@app.route('/logout')
def logout(): logout_user(); return redirect(url_for('login'))

# --- LOGÍSTICA (TODOS) ---
@app.route('/logistica')
@login_required
def logistica():
    clientes = Cliente.query.order_by(Cliente.ultima_compra.asc()).all()
    total = db.session.query(db.func.sum(Cliente.envases_prestados)).scalar() or 0
    return render_template('modulo_logistica.html', clientes=clientes, total_envases=total)

@app.route('/registrar_venta/<int:id>')
@login_required
def registrar_venta(id):
    c = Cliente.query.get(id)
    c.ultima_compra = datetime.utcnow()
    db.session.commit(); return redirect(url_for('logistica'))

@app.route('/modificar_envases/<int:id>/<string:operacion>')
@login_required
def modificar_envases(id, operacion):
    c = Cliente.query.get(id)
    if operacion == 'sumar': c.envases_prestados += 1
    elif operacion == 'restar' and c.envases_prestados > 0: c.envases_prestados -= 1
    db.session.commit(); return redirect(url_for('logistica'))

# --- FINANZAS Y CRM (SOLO ADMIN) ---
@app.route('/finanzas')
@login_required
def finanzas():
    if current_user.rol != 'admin': return redirect(url_for('dashboard'))
    t = Transaccion.query.order_by(Transaccion.fecha.desc()).all()
    ing = db.session.query(db.func.sum(Transaccion.monto)).filter(Transaccion.tipo == 'Ingreso').scalar() or 0
    egr = db.session.query(db.func.sum(Transaccion.monto)).filter(Transaccion.tipo == 'Egreso').scalar() or 0
    return render_template('modulo_finanzas.html', transacciones=t, saldo=(ing-egr), ingresos=ing, egresos=egr)

@app.route('/nueva_transaccion', methods=['POST'])
@login_required
def nueva_transaccion():
    db.session.add(Transaccion(tipo=request.form['tipo'], descripcion=request.form['descripcion'], monto=int(request.form['monto'])))
    db.session.commit(); return redirect(url_for('finanzas'))

@app.route('/crm')
@login_required
def crm():
    if current_user.rol != 'admin': return redirect(url_for('dashboard'))
    return render_template('modulo_crm.html', clientes=Cliente.query.all())

@app.route('/nuevo_cliente', methods=['POST'])
@login_required
def nuevo_cliente():
    db.session.add(Cliente(nombre=request.form['nombre'], direccion=request.form['direccion'], sector=request.form['sector'], telefono=request.form['telefono'], envases_prestados=int(request.form['envases'] or 0)))
    db.session.commit(); return redirect(url_for('crm'))

# --- GESTIÓN USUARIOS (SOLO ADMIN) ---
@app.route('/usuarios')
@login_required
def usuarios():
    if current_user.rol != 'admin': return redirect(url_for('dashboard'))
    return render_template('modulo_usuarios.html', usuarios=Usuario.query.all())

@app.route('/crear_usuario', methods=['POST'])
@login_required
def crear_usuario():
    if current_user.rol == 'admin':
        u = Usuario(username=request.form['username'], password=generate_password_hash(request.form['password']), rol=request.form['rol'])
        db.session.add(u); db.session.commit()
    return redirect(url_for('usuarios'))

@app.route('/inventario')
@login_required
def inventario(): return render_template('modulo_inventario.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)