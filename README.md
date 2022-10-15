# camera-pose-estimator-tool
An interactive online tool to let user upload an image of a scene and place the AR-marker on the scene. The app will use three.ar.js - an Augmented reality library to estimate the pose of the AR marker (and thus the camera pose)

## How to Use

1. Open a background image, using the "Choose file" button. This will open a file on your disk.
2. Click on the image to place the marker. Click and drag the 4 vertices to adjust the position of the marker.
3. The deduced 4x4 transform matrix will be displayed in the textarea. If the marker is in a pose that cannot be detected, the matrix will be all 0.
4. When placing the marker, try to align it with a rectangular feature in a plane of the scene. You can open another background image of the same scene in a different camera direction and place the the marker at the same box to get a different tansform matrix. From the 2 matrices, induce the camera pose.
