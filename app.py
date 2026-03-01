from flask import Flask, render_template, request, redirect
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///distribuidora_agua.db'
db = SQLAlchemy(app)

# Modelo para Clientes de Reparto
class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    direccion = db.Column(db.String(200), nullable=False)
    sector = db.Column(db.String(50))  # Ej: Ciudad Satélite, Los Héroes
    envases_prestados = db.Column(db.Integer, default=0)
    ultima_compra = db.Column(db.DateTime, default=datetime.utcnow)

# Crear la base de datos con la nueva estructura
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    # Ordenamos por última compra para ver quién lleva más tiempo sin agua
    clientes = Cliente.query.order_by(Cliente.ultima_compra.asc()).all()
    return render_template('index.html', clientes=clientes)

@app.route('/nuevo_cliente', methods=['POST'])
def nuevo_cliente():
    nuevo = Cliente(
        nombre=request.form['nombre'],
        direccion=request.form['direccion'],
        sector=request.form['sector'],
        envases_prestados=int(request.form['envases'])
    )
    db.session.add(nuevo)
    db.session.commit()
    return redirect('/')

@app.route('/registrar_venta/<int:id>')
def registrar_venta(id):
    cliente = Cliente.query.get(id)
    cliente.ultima_compra = datetime.utcnow()
    db.session.commit()
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)