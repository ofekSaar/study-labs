"""
Predictive Progression Module

This module provides functionality to predict user progression in a game or application.
It uses a simple linear regression model to forecast future performance based on historical data.

Author: [Your Name]
Date: [Today's Date]
"""

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

class PredictiveProgression:
    """
    Predictive Progression Class

    This class encapsulates the predictive progression functionality.
    It takes in historical data and uses linear regression to forecast future performance.

    Attributes:
        historical_data (list): A list of tuples containing user ID, score, and timestamp
        model (LinearRegression): The linear regression model used for prediction
    """

    def __init__(self, historical_data):
        """
        Initialize the PredictiveProgression class

        Args:
            historical_data (list): A list of tuples containing user ID, score, and timestamp
        """
        self.historical_data = historical_data
        self.model = LinearRegression()

    def train_model(self):
        """
        Train the linear regression model using historical data

        Returns:
            None
        """
        # Extract features (score) and target variable (timestamp)
        X = np.array([data[1] for data in self.historical_data]).reshape(-1, 1)
        y = np.array([data[2] for data in self.historical_data])

        # Split data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Train the model using the training data
        self.model.fit(X_train, y_train)

    def predict_progression(self, user_id):
        """
        Predict future performance for a given user

        Args:
            user_id (int): The ID of the user to predict for

        Returns:
            float: The predicted score at the next timestamp
        """
        # Get historical data for the given user
        user_data = [data for data in self.historical_data if data[0] == user_id]

        # Extract features and target variable from user data
        X = np.array([data[1] for data in user_data]).reshape(-1, 1)
        y = np.array([data[2] for data in user_data])

        # Make predictions using the trained model
        predictions = self.model.predict(X)

        # Return the predicted score at the next timestamp
        return predictions[-1]

# Example usage:
historical_data = [
    (1, 10, 100),
    (1, 20, 200),
    (2, 15, 150),
    (2, 30, 300),
    (3, 25, 250)
]

predictor = PredictiveProgression(historical_data)
predictor.train_model()

print(predictor.predict_progression(1))  # Output: predicted score for user ID 1