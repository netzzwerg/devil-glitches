/**
* read the last events in game, update world 
*/

function die(killer){
  // not implemented yet
  console.log('you die');
}

function update(dt){
  // apply speed to hero movement
  t = dt*hero[4];
  // move depending on keypressed
  if(keyMap&keys[65]){
    hero[0]-=t;
    if(hero[0]<hero[2]) hero[0] = hero[2]; // hero limit on x left
    if(hero[0]>viewPort[2]&&hero[0]<mapPixels-viewPort[2]) viewPort[0]+=t;
  } 
  if(keyMap&keys[87]){
    hero[1]-=t;
    if(hero[1]<hero[2]) hero[1] = hero[2];
    if(hero[1]>viewPort[3]&&hero[1]<mapPixels-viewPort[3]) viewPort[1]+=t;
  }

  if(keyMap&keys[83]){
    hero[1]+=t;
    if(hero[1]>mapPixels - hero[2]) hero[1] = mapPixels - hero[2];
    if(hero[1]>viewPort[3]&&hero[1]<mapPixels-viewPort[3]) viewPort[1]-=t;
  }
  if(keyMap&keys[68]){
    hero[0]+=t;
    if(hero[0]>mapPixels - hero[2]) hero[0] = mapPixels - hero[2];
    if(hero[0]>viewPort[2]&&hero[0]<mapPixels-viewPort[2]) viewPort[0]-=t;
  }

  hero[3] = getAngle([hero[0]+viewPort[0], hero[1]+viewPort[1]], coords);

  var killer = collideElements(hero);
  if(killer)die(killer);
  // if fire shots fire
  if(coords[2]&&hero[6]<=0){
    bullets.push([hero[0]+shake(1, 2+hero[7]/30), hero[1]+shake(1, 2+hero[7]/30), 2, hero[3]+shake(1, 0.05+0.001*hero[7])])
    play(fireSound);
    hero[6] = 1/hero[7]; //12bullets per second
  }else{
    hero[6]-=dt
  }

  // update bullets
  bulletsCycle: for (var i = bullets.length-1; i >= 0; i--) {
    var bullet = bullets[i];
    bullet[0] += Math.cos(bullet[3])*t*bullet[2]; // bullet speed *2
    bullet[1] += Math.sin(bullet[3])*t*bullet[2];
    if(bullet[0]<-20||bullet[0]>mapPixels+20||bullet[1]<-20||bullet[1]>mapPixels+20) bullets.splice(i,1);

    var enemy = collideElements(bullet);
    if(enemy){
      bullets.splice(i,1);
      --enemy[6];
    }
  }

  //update particles
  for(var i=0;i<particles.length;i++){
    var particle = particles[i];
    particle[0] += Math.cos(particle[2])*(2+Math.random()*3);
    particle[1] += Math.sin(particle[2])*(2+Math.random()*3);
    if(--particle[3]<0) particles.splice(i,1)
  }

  spatialhashing = {};
  // update enemies  
  for (var i = enemies.length-1; i >=0; i--) {
    var enemy = enemies[i];
    // have zero life
    if(enemy[6]<=0){
      enemies.splice(i,1);
      for (var h = -10; h < 10; h++) {
        particles.push([enemy[0], enemy[1], enemy[2]+particleZ*h*Math.random(), 100])
      }
      continue;
    }

    // miniom 
    if(enemy[5]<5){
      if(enemy[10]*(enemy[9]-enemy[3])>0){
        enemy[3] = getAngle(enemy, hero);
        enemy[10] = enemy[3]>enemy[9]?0.1:-0.1;
      }

      var otherEnemy = collideElements(enemy);
      enemy[9] +=(otherEnemy?-1:1)*enemy[10];

      enemy[0] += Math.cos(enemy[9])*t*1.2;
      enemy[1] += Math.sin(enemy[9])*t*1.2;

    // spawner
    }else{
      enemy[9]-=dt;

      if(enemy[9]<0){
        for (var j = 0; j<9; j++) {
          if(j==4) continue;  //summon especial 
          var newEnemy = createEnemy(enemy[0]+(j%3-1)*tileset,enemy[1]+(Math.floor(j/3)-1)*tileset, 0)
          enemies.push(newEnemy);
        }
        enemy[9]=20;  // time to summon again
      }
    }
    addItem(enemy);
  }

}

function shake(cond, val){
  return cond?(Math.random()*val*2-val):0;
}

/**
helper function to draw paths.
*/
function path(xpts, ypts, offsetX, offsetY){
  ctx.moveTo(xpts[0]+offsetX, ypts[0]+offsetY);
  for (var i = 1; i<xpts.length; i++) {
    ctx.lineTo(xpts[i]+offsetX, ypts[i]+offsetY);
  }
}

function pathEnemy(enemy){
  ctx.rotate(enemy[9])
  ctx.strokeRect(enemy[7][0], enemy[8][1], enemy[2]*2, enemy[2]*2)
  ctx.rotate(-enemy[9])
}

function pathTotem(totem){

  for (var i = 0; i < totem[7].length; i++) {
    drawFace(totem[7][i], totem[8][i], totem[2], i);
  }
}

function getRandomColor(r,r2,g,g2,b,b2,a,a2){
  return 'rgba('+(Math.floor(Math.random()*r)+r2)+','+(Math.floor(Math.random()*g)+g2)+','+(Math.floor(Math.random()*b)+b2)+','+(Math.floor(Math.random()*a)+a2)+')';
}

function drawFace(xPath, yPath, size, index){
  ctx.beginPath();
  var value = 125-index*20;
  ctx.fillStyle = getRandomColor(value,50, value,50,value,50,0,1);
  ctx.moveTo(xPath[0]*size, yPath[0]*size);
  for (var i = 1; i<xPath.length; i++) {
    ctx.lineTo(xPath[i]*size, yPath[i]*size);
  }
  ctx.closePath();
  ctx.fill()
  ctx.stroke()
}


function draw(t){
  // draw map
  //some random points
  ctx.fillStyle= 'rgba(0,0,0,0.18)';
  ctx.fillRect(0,0,FW, FH);
  ctx.fillStyle = getRandomColor(180,0, 185,0,185,0,0,1);
  for(var i=0;i<6;i++) ctx.fillRect(Math.random()*800, Math.random()*600, 2, 2)
  ctx.save()

  ctx.strokeStyle = "#545EB4";
  var gridSize = H/mapSize
  ctx.beginPath();
  shakeScreen = [shake(coords[2], 2), shake(coords[2], 2)]
  ctx.translate(shakeScreen[0], shakeScreen[1]);
  ctx.fillStyle = 'rgba(12,27,46,0.2)';
  ctx.translate(viewPort[0], viewPort[1])
  ctx.fillRect(0, 0, mapPixels, mapPixels)
  for(var i = 0; i <= mapSize; i++){
    ctx.moveTo(i*tileset, 0);
    ctx.lineTo(i*tileset, mapPixels);
    ctx.moveTo(0, i*tileset);
    ctx.lineTo(mapPixels, i*tileset);
  }

  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle='#6a6';
  // fill corruption 
  for (var j = 0; j < mapSize; j++) {
    for (var i = 0; i < mapSize; i++) {
      if(map[j][i]==0) continue;
      ctx.fillRect(i*tileset+viewPort[0]+shakeScreen[0], j*tileset+viewPort[1]+shakeScreen[1], tileset, tileset);
    }
  }
  ctx.fill();
  ctx.closePath();
  ctx.stroke();
  ctx.restore();



  // draw hero

  ctx.save();
  ctx.translate(hero[0] + viewPort[0] + shake(coords[2], 1), hero[1] + viewPort[1]+ shake(coords[2], 1));
  ctx.rotate(hero[3]+Math.PI/2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#F952FF";
  ctx.beginPath();
  path(heroShape[0], heroShape[1],0,0);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // draw enemies

  ctx.save();
  for (var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];
    if(enemy[0]+viewPort[0]<20||enemy[0]+viewPort[0]>W-20||enemy[1]+viewPort[1]<20||enemy[1]+viewPort[1]>H-20) continue
    //ctx.rotate(enemy[2]);
    var offsetX = enemy[0]+viewPort[0]+shakeScreen[0]; // 20 /2 width/2
    var offsetY = enemy[1]+viewPort[1]+shakeScreen[1]; //
    ctx.translate(offsetX, offsetY)
    ctx.beginPath();
    if(enemy[5]<5){
      ctx.strokeStyle = getRandomColor(125,50, 125,50,125,50,0,1);
      ctx.lineWidth = 3;
      pathEnemy(enemy);
    }else{
      ctx.strokeStyle = '#07000A';
      ctx.lineWidth = 1;
      pathTotem(enemy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.translate(-offsetX, -offsetY)
    //ctx.fill(); 
  }
  ctx.closePath();
  ctx.restore();

  // draw bullets 
  ctx.save();
  ctx.fillStyle = '#37ACE7';
  for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i];
    if(bullet[0]+viewPort[0]<20||bullet[0]+viewPort[0]>W-20||bullet[1]+viewPort[1]<20||bullet[1]+viewPort[1]>H-20) continue
    ctx.beginPath();
    ctx.arc(bullet[0]+viewPort[0], bullet[1]+viewPort[1], bullet[2], 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();


  //draw particles 
  ctx.save();
  ctx.fillStyle = getRandomColor(125,50, 125,50,125,50,0,1);
  for (var i = 0; i < particles.length; i++) {
    var particle = particles[i];
    if(particle[0]+viewPort[0]<5||particle[0]+viewPort[0]>W-5||particle[1]+viewPort[1]<5||particle[1]+viewPort[1]>H-5) continue
    ctx.beginPath();
    ctx.fillStyle = getRandomColor(125,0, 125,100,125,100,0,particle[3]/100);
    ctx.arc(particle[0]+viewPort[0], particle[1]+viewPort[1], 2, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // cross  
  ctx.save();
  ctx.lineWidth = 2;
  ctx.translate(coords[0], coords[1]);
  ctx.strokeStyle = "#F952FF";
  hero[5]+=(t*25*(coords[2]*8+1))
  hero[5]%=360
  ctx.translate(-10, -10);
  ctx.beginPath();
  ctx.moveTo(0, 10)
  ctx.lineTo(20, 10)
  ctx.moveTo(10, 0)
  ctx.lineTo(10, 20)
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // ui
  ctx.save();
  
  drawWord(score.toFixed(0), 750, 60,16, '#2F2');
  drawWord(score.toFixed(0), 751, 61,16, '#FFF');
  drawWordCenter(message, 401, 501,14, '#90702F');
  drawWordCenter(message, 402, 502,14, '#D6AE45');
  ctx.restore();

}


var lastTime;
function loop(t){
  // webgl postprocessing  
  if(DEBUG){
    _fps_.begin();
    _processing_.begin();
    _memory_.begin();
    _enemies_.begin();
  }

  if(!lastTime) lastTime = t;
  dt = (Math.min(100, t-lastTime)/1000);
  lastTime = t;
  frame++;

  // update changes
  update(dt);
  // draw changes 
  ctx.save()
  draw(dt);
  ctx.restore()

  drawPostProcessing(Math.floor(t));
  score += dt*1000;

  if(DEBUG){
    _fps_.end();
    _processing_.end();
    _memory_.end();
    _enemies_.end();
    enemiesPanel.update( enemies.length, 1000);
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

var necronomicon = [
//size, angle, index, type, hits, xpoints, ypoints, customData:angleTarget, customData: angleMomentum
[10, 0,0,0,2, [-10,10,10,-10], [-10,-10,10,10],0,3]
,
,
,
,
,
,

//size, angle, index, type, hits, xpoints, ypoints, customData:nextInvocation
[tileset/2, 0, 0, 6, 15, [[-1,0,0],[0,0,1],[-1,1,0]], [[-1.5,-0.5,0.5],[-0.5,0.5,-1.5],[-1.5,-1.5,-0.5]], 1]
]

function createEnemy(x, y, type){
  return [x, y].concat(necronomicon[type].slice(0))
}

var letterIndex = 0;
function summon(){
  letterIndex+=0.1;
  if(letterIndex>=messages.length)
    letterIndex=0;
  message = messages[Math.floor(letterIndex)]
  var newSpawner = createEnemy(tileset*(Math.floor(Math.random()*mapSize)+0.5), tileset*(Math.floor(Math.random()*mapSize)+0.5), 6);
  enemies.push(newSpawner);
  setTimeout(function(){
    summon()
    }, 8000)
  }
summon()