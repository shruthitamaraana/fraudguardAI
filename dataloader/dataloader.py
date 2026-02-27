"""Data Loader"""

import numpy as np
import jsonschema
import pandas as pd
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
from configs.data_schema import SCHEMA


# ------------------------------
# CREATE SEQUENCES FOR LSTM
# ------------------------------
def create_sequences(df, sequence_length=5):

    sequences = []
    labels = []

    grouped = df.groupby("UserId")

    for _, group in grouped:

        group = group.sort_index()

        data = group.drop(columns=["Fake","UserId"]).values
        target = group["Fake"].values

        for i in range(len(group) - sequence_length):

            seq = data[i:i+sequence_length]
            label = target[i+sequence_length]

            sequences.append(seq)
            labels.append(label)

    return np.array(sequences), np.array(labels)


class DataLoader:
    """Data Loader class"""

    @staticmethod
    def load_data(data_config):
        return pd.read_csv(data_config.path)

    @staticmethod
    def load_test_data(data_config):
        return pd.read_csv(data_config.path)

    @staticmethod
    def validate_schema(data_point):
        jsonschema.validate({'data': data_point.tolist()}, SCHEMA)

    @staticmethod
    def preprocess_data(dataset):

        # Encode user id
        labelencoder_X = LabelEncoder()
        dataset.UserId = labelencoder_X.fit_transform(dataset.UserId)

        # One hot encoding
        dataset = pd.get_dummies(dataset, columns=['Event','Category'])

        # Normalize
        scaler = MinMaxScaler()
        dataset['UserId'] = scaler.fit_transform(dataset[['UserId']])

        # ------------------------------
        # CREATE LSTM SEQUENCES
        # ------------------------------
        X_seq, Y_seq = create_sequences(dataset)

        X_seq = np.array(X_seq, dtype=np.float32)
        Y_seq = np.array(Y_seq, dtype=np.float32)

        # Train Test Split
        X_train, X_test, Y_train, Y_test = train_test_split(
            X_seq, Y_seq, test_size=0.2, random_state=42
        )

        return X_train, X_test, Y_train, Y_test


    @staticmethod
    def preprocess_test_data(test_dataset):

        labelencoder_X = LabelEncoder()
        test_dataset.UserId = labelencoder_X.fit_transform(test_dataset.UserId)

        test_dataset = pd.get_dummies(test_dataset, columns=['Event','Category'])

        scaler = MinMaxScaler()
        test_dataset['UserId'] = scaler.fit_transform(test_dataset[['UserId']])

        return test_dataset
