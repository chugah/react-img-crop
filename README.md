React Image Crop Application

This application will perform the following events on the client:

1. A user can upload a local image file to Canvas
2. A user can select a rectangle area on the image which act as crop guides
3. The rectangle lines are visible on the canvas when the user is dragging the mouse
4. The rectangle disappears when mouse is released
5. The app generates and displays the crop image beneath original image

The application was developed using create react app.

To run the application, perform the following steps:

1. Open a terminal
2. Git clone the repo
3. cd into the repo directory
4. Run the command npm install to install node modules
5. Run the command npm start which opens the browser
6. The application is served on localhost:3000

- Ensure node/npm is installed on computer
- Node version used: 10.15.0
- npm version used: 6.5.0

Please check which node / npm version available on computer. It looks like
node 8+ should be ok. See https://nodejs.org/en/about/releases/.

Using the Application

1. When the app loads, there is a button to upload an image
2. Click on the button and a window appears of your systems file directory
3. Navigate to an image file
4. Select this image file
5. Select open
6. Image will now render in the browser
7. When image first renders, crop guides will appear on it
8. The crop guide will start at the upper left corner
9. The crop guide will be roughly 300 px in width and 170 px in height
10. It is possible to move the entire crop guide using the all-scroll or
    move cursor
11. It is also possible to move the crop guide using the re-size cursor
12. The image contained within the crop guides will appear below the
    original image
