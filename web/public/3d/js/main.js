(function() {
  "use strict";

  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
  })();

  var WEB_GL_ENABLED = true;
  var MAX_NUM_ORBITS = 40;
  var stats, scene, renderer, composer;
  var camera, cameraControls;
  var pi = Math.PI;
  var using_webgl = false;
  //var clock = new THREE.Clock();
  var fly_around = true;
  var rendered_particles = [];
  var planets = [];
  var jed = 2451545.0;

  if(!init())	animate();

  // init the scene
  function init(){
    if(WEB_GL_ENABLED && Detector.webgl){
      renderer = new THREE.WebGLRenderer({
        antialias		: true,	// to get smoother output
        preserveDrawingBuffer	: true	// to allow screenshot
      });
      renderer.setClearColorHex(0x000000, 1);
      using_webgl = true;
    }
    else{
      renderer	= new THREE.CanvasRenderer();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Set up stats
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild(stats.domElement);

    // create a scene
    scene = new THREE.Scene();

    // put a camera in the scene
    var cameraH	= 3;
    var cameraW	= cameraH / window.innerHeight * window.innerWidth;
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    //camera.position.set(0, -80, 85.60706096322108);
    //camera.position.set(14.92119498929974, -70.76590667539001, -52.278328402168306);
    camera.position.set(22.39102192510384, -124.78460848134833, -55.29382439584528);


    window.cam = camera;
    THREE.Object3D._threexDomEvent.camera(camera);    // camera mouse handler

    scene.add(camera);

    cameraControls	= new THREE.TrackballControls(camera)
    //cameraControls	= new THREE.RollControls(camera)
    cameraControls.staticMoving = true;
    cameraControls.panSpeed = 2;
    cameraControls.zoomSpeed = 3;
    cameraControls.maxDistance = 1100;

    // Rendering stuff

    // "sun" - 0,0 marker
    (function() {
      var geometry= new THREE.SphereGeometry(1);
      var material= new THREE.MeshBasicMaterial({color: 0xffee00});
/*
      var sprite = sprite = THREE.ImageUtils.loadTexture("/images/sunsprite.png");
      var material = new THREE.ParticleBasicMaterial({
        map: sprite,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          sizeAttenuation: false,
          vertexColors: true
      });
*/
      var mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    })();

    /*
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(75, 75), new THREE.MeshBasicMaterial({
        color: 0x0000ff
    }));
    plane.overdraw = true;
    plane.doubleSided = true;
    plane.rotation.x = pi/2;
    scene.add(plane);
    */

    // Ellipses
    runAsteroidQuery();
    var mercury = new Orbit3D(Ephemeris.mercury,
        {color: 0x913CEE, width: 3, jed: jed});
    scene.add(mercury.getObject());
    scene.add(mercury.getParticle());
    var venus = new Orbit3D(Ephemeris.venus,
        {color: 0xFF7733, width: 3, jed: jed});
    scene.add(venus.getObject());
    scene.add(venus.getParticle());
    var earth = new Orbit3D(Ephemeris.earth,
        {color: 0x009ACD, width: 3, jed: jed});
    scene.add(earth.getObject());
    scene.add(earth.getParticle());
    var mars = new Orbit3D(Ephemeris.mars,
        {color: 0xA63A3A, width: 3, jed: jed});
    scene.add(mars.getObject());
    scene.add(mars.getParticle());
    var jupiter = new Orbit3D(Ephemeris.jupiter,
        {color: 0xFF7F50, width: 3, jed: jed});
    scene.add(jupiter.getObject());
    scene.add(jupiter.getParticle());

    planets.push.apply(planets, [mercury, venus, earth, mars, jupiter]);

    // Sky
    if (using_webgl) {
      var materialArray = [];
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      var skyboxGeom = new THREE.CubeGeometry(5000, 5000, 5000, 1, 1, 1, materialArray);
      var skybox = new THREE.Mesh( skyboxGeom, new THREE.MeshFaceMaterial() );
      skybox.flipSided = true;
      scene.add(skybox);
    }

    $('#container').on('mousedown', function() {
      fly_around = false;
    });
  }

  // animation loop
  function animate() {
    update();
    if (fly_around) {
      var timer = 0.0001 * Date.now();
      cam.position.x = Math.cos( timer ) * 50;
      //cam.position.y = Math.sin( timer ) * 100;
      cam.position.z = -100 + Math.sin( timer ) * 40;
    }
    jed += 1;
    for (var i=0; i < planets.length; i++) {
      planets[i].MoveParticle(jed);
    }
    for (var i=0; i < rendered_particles.length; i++) {
      rendered_particles[i].MoveParticle(jed);
    }
    render();
    requestAnimationFrame(animate);
  }

  function update() {
    stats.update();
  }

  // render the scene
  function render() {
    // update camera controls
    //cameraControls.update(clock.getDelta());
    cameraControls.update();

    // actually render the scene
    renderer.render(scene, camera);
  }

  function runAsteroidQuery(sort) {
    sort = sort || 'score';
    var lastHovered;
    $.getJSON('/top?sort=' + sort + '&n=' + MAX_NUM_ORBITS + '&use3d=true', function(data) {
      var n = data.results.rankings.length;
      rendered_particles = [];
      for (var i=0; i < n; i++) {
        var roid = data.results.rankings[i];
        var orbit = new Orbit3D(roid, {
          color: 0xffffff,
          width:2,
          object_size:1,
          jed: jed
        }, scene);
        console.log(roid);
        (function(roid, orbit, i) {
          orbit.getParticle().on('mouseover', function(e) {
            if (lastHovered) scene.remove(lastHovered);
            lastHovered = orbit.getObject();
            scene.add(lastHovered);
            $('#main-caption').html(roid.full_name + ' - $' + roid.fuzzed_price + ' in potential value');
            $('#other-caption').html('(ranked #' + (i+1) + ')');
          });
        })(roid, orbit, i);
        scene.add(orbit.getParticle());
        rendered_particles.push(orbit);
      }
      $('#loading').hide();
    });
  }
})();

if (!window.console) window.console = {log: function() {}};
