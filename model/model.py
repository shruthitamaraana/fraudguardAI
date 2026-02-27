import numpy as np
import pandas as pd
import tensorflow as tf
from dataloader.dataloader import DataLoader, create_sequences
from utils.logger import get_logger
from .base_model import BaseModel
from executor.trainer import Trainer

LOG = get_logger('click')


class CLICK(BaseModel):

    def __init__(self, config):
        super().__init__(config)

        self.model = None
        self.dataset = None
        self.test_dataset = None

        self.batch_size = self.config.train.batch_size
        self.epoches = self.config.train.epoches
        self.metrics = self.config.train.metrics

        self.X_train = []
        self.X_test = []
        self.Y_train = []
        self.Y_test = []

    # ------------------------------
    # LOAD DATA
    # ------------------------------
    def load_data(self):

        LOG.info(f'Loading {self.config.data.path} dataset...')

        self.dataset = DataLoader.load_data(self.config.data)
        self.dataset = self.dataset.drop('Unnamed: 0', axis=1)

        self.X_train, self.X_test, self.Y_train, self.Y_test = DataLoader.preprocess_data(self.dataset)

    # ------------------------------
    # BUILD LSTM MODEL
    # ------------------------------
    def build(self):

        input_shape = (self.X_train.shape[1], self.X_train.shape[2])

        self.model = tf.keras.models.Sequential([

            tf.keras.layers.LSTM(64, return_sequences=True, input_shape=input_shape),
            tf.keras.layers.Dropout(0.3),

            tf.keras.layers.LSTM(32),
            tf.keras.layers.Dropout(0.3),

            tf.keras.layers.Dense(16, activation='relu'),

            tf.keras.layers.Dense(1, activation='sigmoid')
        ])

        LOG.info('LSTM Tensorflow Model was built successfully')

    # ------------------------------
    # TRAIN MODEL
    # ------------------------------
    def train(self):

        LOG.info('Training started...')

        trainer = Trainer(
            self.model,
            self.X_train,
            self.Y_train,
            self.X_test,
            self.Y_test,
            self.batch_size,
            self.metrics,
            self.epoches
        )

        trainer.train()

    # ------------------------------
    # LOAD TEST DATA
    # ------------------------------
    def load_test_data(self):

        LOG.info(f'Loading {self.config.test_data.path} dataset...')

        self.test_dataset = DataLoader.load_test_data(self.config.test_data)

        if 'Unnamed: 0' in self.test_dataset.columns:
            self.test_dataset = self.test_dataset.drop('Unnamed: 0', axis=1)

        self.test_dataset = DataLoader.preprocess_test_data(self.test_dataset)

    # ------------------------------
    # EVALUATE (FIXED FOR LSTM)
    # ------------------------------
    def evaluate(self):

        LOG.info('Predicting for test dataset')

        # 🔥 IMPORTANT: create sequences like training
        test_sequences, _ = create_sequences(self.test_dataset, sequence_length=5)

        predicted_results = self.model.predict(test_sequences)

        fake_prediction = (predicted_results > 0.5).astype(int)

        print("Total fraud predicted:", np.sum(fake_prediction))

