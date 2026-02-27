import tensorflow as tf

# load old model using TF loader
old_model = tf.saved_model.load("saved_models/click_model/1")

infer = old_model.signatures["serving_default"]

# build wrapper keras model
inputs = tf.keras.Input(shape=(5,11))
outputs = infer(inputs)

outputs = list(outputs.values())[0]

new_model = tf.keras.Model(inputs=inputs, outputs=outputs)

# SAVE NEW FORMAT
new_model.save("saved_models/click_model.keras")

print("✅ Model converted to Keras format")
