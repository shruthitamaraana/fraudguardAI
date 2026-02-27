import os
import tensorflow as tf
from utils.logger import get_logger
from tensorflow.keras.optimizers import RMSprop
LOG = get_logger('trainer')


class Trainer:

    def __init__(self, model, X_train, Y_train, X_test, Y_test, batch_size, metric, epoches,):
        self.model = model
        self.batch_size = batch_size
        self.metric = metric
        self.epoches = epoches
        self.X_train = X_train
        self.Y_train = Y_train
        self.X_test = X_test
        self.Y_test = Y_test
        from sklearn.utils.class_weight import compute_class_weight
        import numpy as np

        class_weights = compute_class_weight(
            class_weight='balanced',
            classes=np.unique(self.Y_train),
            y=self.Y_train
        )

        self.class_weight = {
            0: class_weights[0],
            1: class_weights[1]
        }

        self.log_dir = 'Classification_dir'
        self.callback = tf.keras.callbacks.TensorBoard(log_dir=self.log_dir, histogram_freq=1)

        self.model_save_path = 'saved_models/'


    def train(self):

        self.model.compile(
            loss='binary_crossentropy',
            optimizer=RMSprop(),
            metrics=self.metric
        )

        print(self.X_train.shape)
        print(self.X_test.shape)
        print(self.Y_train.shape)
        print(self.Y_test.shape)

        history = self.model.fit(
            self.X_train,
            self.Y_train,
            batch_size=self.batch_size,
            epochs=self.epoches,
            validation_data=(self.X_test, self.Y_test),
            class_weight=self.class_weight
        )

        from sklearn.metrics import classification_report, confusion_matrix

        y_prob = self.model.predict(self.X_test)
        y_pred = (y_prob.flatten() > 0.5).astype(int)

        print(confusion_matrix(self.Y_test, y_pred))
        print(classification_report(self.Y_test, y_pred))

        # ✅ SAVE MODEL IN KERAS FORMAT (FINAL FIX)
        save_path = "saved_models/click_model.keras"
        self.model.save(save_path)

        print("✅ Model saved successfully at:", save_path)
