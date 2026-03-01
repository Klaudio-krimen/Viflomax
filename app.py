import os
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
# Configuración de Seguridad
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'viflomax_maipu_2026_seguro')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///viflomax_sap.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- SISTEMA DE LOGIN Y ROLES ---
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class Usuario(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), default='trabajador') # 'admin' o 'trabajador'

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))

# --- MODELOS DE NEGOCIO ---
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
    tipo = db.Column(db.String(20)) # 'Ingreso' o 'Egreso'
    descripcion = db.Column(db.String(100))
    monto = db.Column(db.Integer)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

# --- INICIALIZACIÓN DE DB (FIJACIÓN PARA RENDER) ---
with app.app_context():
    db.create_all()
    # Crear admin por defecto si la base está vacía
    if not Usuario.query.filter_by(username='claudio').first():
        hashed_pw = generate_password_hash('viflomax2026')
        admin = Usuario(username='claudio', password=hashed_pw, rol='admin')
        db.session.add(admin)
        db.session.commit()

# --- RUTAS DE NAVEGACIÓN ---

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = Usuario.query.filter_by(username=request.form['username']).first()
        if user and check_password_hash(user.password, request.form['password']):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Usuario o contraseña incorrectos')
    return render_template('login.html')

@app.route('/')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/logistica')
@login_required
def logistica():
    clientes = Cliente.query.order_by(Cliente.ultima_compra.asc()).all()
    total = db.session.query(db.func.sum(Cliente.envases_prestados)).scalar() or 0
    return render_template('modulo_logistica.html', clientes=clientes, total_envases=total)

@app.route('/crm')
@login_required
def crm():
    if current_user.rol != 'admin':
        flash('Acceso restringido al Administrador')
        return redirect(url_for('dashboard'))
    clientes = Cliente.query.all()
    return render_template('modulo_crm.html', clientes=clientes)

@app.route('/finanzas')
@login_required
def finanzas():
    if current_user.rol != 'admin':
        flash('Acceso restringido al Administrador')
        return redirect(url_for('dashboard'))
    t = Transaccion.query.order_by(Transaccion.fecha.desc()).all()
    ing = db.session.query(db.func.sum(Transaccion.monto)).filter(Transaccion.tipo == 'Ingreso').scalar() or 0
    egr = db.session.query(db.func.sum(Transaccion.monto)).filter(Transaccion.tipo == 'Egreso').scalar() or 0
    return render_template('modulo_finanzas.html', transacciones=t, saldo=(ing-egr), ingresos=ing, egresos=egr)

@app.route('/inventario')
@login_required
def inventario():
    return render_template('modulo_inventario.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

# --- ACCIONES ---

@app.route('/nuevo_cliente', methods=['POST'])
@login_required
def nuevo_cliente():
    nuevo = Cliente(
        nombre=request.form['nombre'],
        direccion=request.form['direccion'],
        sector=request.form['sector'],
        telefono=request.form['telefono'],
        envases_prestados=int(request.form['envases'] or 0)
    )
    db.session.add(nuevo)
    db.session.commit()
    return redirect(url_for('crm'))

@app.route('/registrar_venta/<int:id>')
@login_required
def registrar_venta(id):
    c = Cliente.query.get(id)
    c.ultima_compra = datetime.utcnow()
    db.session.commit()
    return redirect(url_for('logistica'))

@app.route('/modificar_envases/<int:id>/<string:operacion>')
@login_required
def modificar_envases(id, operacion):
    c = Cliente.query.get(id)
    if operacion == 'sumar': c.envases_prestados += 1
    elif operacion == 'restar' and c.envases_prestados > 0: c.envases_prestados -= 1
    db.session.commit()
    return redirect(url_for('logistica'))

@app.route('/nueva_transaccion', methods=['POST'])
@login_required
def nueva_transaccion():
    nt = Transaccion(tipo=request.form['tipo'], descripcion=request.form['descripcion'], monto=int(request.form['monto']))
    db.session.add(nt)
    db.session.commit()
    return redirect(url_for('finanzas'))

# --- CONFIGURACIÓN PARA RENDER ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)