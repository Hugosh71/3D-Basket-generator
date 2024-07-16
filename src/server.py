from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/customize', methods=['POST'])
def customize():
    data = request.json
    shoe_type = data['shoeType']
    description = data['description']
    
    model_path = f"/src/models/basket.glb"  

    return jsonify({"model": model_path})

if __name__ == '__main__':
    app.run(debug=True)
