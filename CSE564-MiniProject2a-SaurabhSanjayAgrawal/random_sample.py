import pandas as pd

data = pd.read_csv("Udemy_Development_Courses.csv")
data = data.sample(500)

# print(data)

data.to_csv('Udemy_Development_Courses_sampled3.csv')
