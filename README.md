# Vue Weather App
Vue.js server-side weather app with Express.js server that uses Open Weather Map APIs to retrieve the forecast for the next 5 days and calculates an "outdoor activity rating" for each day. In addition, the Pexels API is used to retrieve background images of the requested city.

### Unique feature 
My weather app has an **"Outdoor Activity Score"** for each day which allows a user to quickly see which days of their holiday will be ideal for outdoor activities and which days are not suitable for being outdoors. To calculate this score, each day starts with 10 points, and then points are deducted based on a number of factors such as the temperature being below 5 degrees or above 35, the rainfall being greater than 35 millimetres, and so on. I have a function that calculates this score and returns a rating out of 10.

![image](https://github.com/tmoroney/vue-weather-app/assets/72154813/547870e1-1621-49ee-ae92-5afaa1939a89)
![image](https://github.com/tmoroney/vue-weather-app/assets/72154813/cb9e12e0-36f8-4391-9714-1853a49724a5)

