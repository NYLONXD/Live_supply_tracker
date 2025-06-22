import pandas as pd
from sklearn.linear_model import LinearRegression
import pickle

data = pd.DataFrame({
    'distance': [10, 20, 30, 40],
    'speed': [40, 40, 40, 40]
})
data['eta'] = data['distance'] / data['speed']

X = data[['distance', 'speed']]
y = data['eta']

model = LinearRegression().fit(X, y)

with open('model/eta_model.pkl', 'wb') as f:
    pickle.dump(model, f)
