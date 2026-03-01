from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
# Base de datos local para la distribuidora
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///distribuidora_maipu.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelo de Datos del Cliente y sus Envases
class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    direccion = db.Column(db.String(200), nullable=False)
    sector = db.Column(db.String(50), nullable=False)
    envases_prestados = db.Column(db.Integer, default=0)
    ultima_compra = db.Column(db.DateTime, default=datetime.utcnow)

# Crear la base de datos
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    # Obtenemos todos los clientes ordenados por la compra más antigua (prioridad de reparto)
    clientes = Cliente.query.order_by(Cliente.ultima_compra.asc()).all()
    
    # Cálculos para el resumen del negocio
    total_envases = db.session.query(db.func.sum(Cliente.envases_prestados)).scalar() or 0
    clientes_activos = Cliente.query.count()
    
    return render_template('index.html', clientes=clientes, total_envases=total_envases, clientes_activos=clientes_activos)

@app.route('/nuevo_cliente', methods=['POST'])
def nuevo_cliente():
    nuevo = Cliente(
        nombre=request.form['nombre'],
        direccion=request.form['direccion'],
        sector=request.form['sector'],
        envases_prestados=int(request.form['envases'] or 0)
    )
    db.session.add(nuevo)
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/registrar_venta/<int:id>')
def registrar_venta(id):
    cliente = Cliente.query.get(id)
    cliente.ultima_compra = datetime.utcnow()
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/modificar_envases/<int:id>/<string:operacion>')
def modificar_envases(id, operacion):
    cliente = Cliente.query.get(id)
    if operacion == 'sumar':
        cliente.envases_prestados += 1
    elif operacion == 'restar' and cliente.envases_prestados > 0:
        cliente.envases_prestados -= 1
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/eliminar/<int:id>')
def eliminar(id):
    cliente = Cliente.query.get(id)
    db.session.delete(cliente)
    db.session.commit()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)