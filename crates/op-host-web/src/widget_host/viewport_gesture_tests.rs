use super::*;

fn cam(pan_x: f32, zoom: f32) -> Camera {
    Camera {
        pan_x,
        pan_y: 0.0,
        zoom,
    }
}

#[test]
fn gestures_last_until_the_camera_settles_and_track_zoom_separately() {
    let mut gesture = ViewportGesture::default();
    assert!(!gesture.observe(cam(0.0, 1.0), 0));
    assert!(gesture.observe(cam(5.0, 1.0), 10));
    assert!(!gesture.zooming(), "a pan is not a zoom");
    assert!(gesture.observe(cam(5.0, 1.5), 20));
    assert!(gesture.zooming());
    assert!(gesture.observe(cam(5.0, 1.5), 20 + SETTLE_MS - 1));
    assert!(!gesture.observe(cam(5.0, 1.5), 20 + SETTLE_MS));
    assert!(!gesture.zooming());
}
