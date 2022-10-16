# camera-pose-estimator-tool
An interactive online tool to let user upload an image of a scene and place the AR-marker on the scene. The app will use three.ar.js - an Augmented reality library to estimate the pose of the AR marker (and thus the camera pose)

## How to Use

1. Open a background image, using the "Choose file" button. This will open a file on your disk.
2. Click on the image to place the marker. Click and drag the 4 vertices to adjust the position of the marker.
3. The deduced 4x4 transform matrix will be displayed in the textarea. If the marker is in a pose that cannot be detected, the matrix will be all 0.
4. When placing the marker, try to align it with a rectangular feature in a plane of the scene. You can open another background image of the same scene in a different camera direction and place the the marker at the same box to get a different tansform matrix. From the 2 matrices, induce the camera pose.

[Link to the app](https://yuhanz.github.io/camera-pose-estimator-tool/index.html)

To induce the transformation matrix between the matrices of 2 scenes:
- We have 2 transformation matrices: m1 and m2
- m1 is the transformation to bring the marker from the identity matrix to scene 1
- m2 is the transformation to bring the marker from the identity matrix to scene 2
- The inverse of m1 brings the marker back to the identity matrix. Use your favorite library to solve `inv = np.linalg.inv(m1)`
- To transform from m1 to m2, transform m1 back to identity, then transform identity to m2: `m1 * inv * m2 = m2` -> `m1 * (inv * m2) = m2`. Thus `inv * m2` transforms m1 to m2 (from scene 1 to scene 2)
