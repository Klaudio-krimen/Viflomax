from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'viflomax_ultra_secret_2026_maipu'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///viflomax_sap.db'
db = SQLAlchemy(app)

# --- SEGURIDAD Y SESIONES ---
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class Usuario(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False) # Aumentado para hash
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
    tipo = db.Column(db.String(20))
    descripcion = db.Column(db.String(100))
    monto = db.Column(db.Integer)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

# --- CREACIÓN DE BASE DE DATOS Y USUARIOS ---
with app.app_context():
    db.create_all()
    # Creamos al dueño (admin) con clave encriptada si no existe
    if not Usuario.query.filter_by(username='claudio').first():
        hashed_pw = generate_password_hash('viflomax2026')
        db.session.add(Usuario(username='claudio', password=hashed_pw, rol='admin'))
        # Creamos un trabajador de prueba
        hashed_pw_trab = generate_password_hash('reparto123')
        db.session.add(Usuario(username='repartidor1', password=hashed_pw_trab, rol='trabajador'))
        db.session.commit()

# --- RUTAS DE ACCESO ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = Usuario.query.filter_by(username=request.form['username']).first()
        if user and check_password_hash(user.password, request.form['password']):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Credenciales incorrectas')
    return render_template('login.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

# --- RUTAS PROTEGIDAS ---
@app.route('/')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/logistica')
@login_required
def logistica():
    clientes = Cliente.query.all()
    total = db.session.query(db.func.sum(Cliente.envases_prestados)).scalar() or 0
    return render_template('modulo_logistica.html', clientes=clientes, total_envases=total)

@app.route('/finanzas')
@login_required
def finanzas():
    if current_user.rol != 'admin':
        return "Acceso denegado: Solo para el Dueño.", 403
    t = Transaccion.query.all()
    ing = db.session.query(db.func.sum(Transaccion.monto)).filter(Transaccion.tipo == 'Ingreso').scalar() or 0
    egr = db.session.query(db.func.sum(Transaccion.monto)).filter(Transaccion.tipo == 'Egreso').scalar() or 0
    return render_template('modulo_finanzas.html', transacciones=t, saldo=(ing-egr), ingresos=ing, egresos=egr)

@app.route('/crm')
@login_required
def crm():
    if current_user.rol != 'admin':
        return "Acceso denegado.", 403
    clientes = Cliente.query.all()
    return render_template('modulo_crm.html', clientes=clientes)

@app.route('/inventario')
@login_required
def inventario():
    return render_template('modulo_inventario.html')

# --- ACCIONES ---
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

if __name__ == '__main__':
    app.run(debug=True)