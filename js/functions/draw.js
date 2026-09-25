// functions/draw.js
// (moved out of js/canvas.js)

function draw(text_surface) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 800, 600);
  ctx.clip();

  clearScreen(BLACK);
  if (state.moment_active) {
    fillRect(keep_rect.x, keep_rect.y, keep_rect.w, keep_rect.h, "rgb(100,200,100)");
    drawText("keep it", keep_rect.x + 10, keep_rect.y + 10, BLACK);
    fillRect(share_rect.x, share_rect.y, share_rect.w, share_rect.h, "rgb(100,150,220)");
    drawText("give it", share_rect.x + 10, share_rect.y + 10, BLACK);
  }
   if (isNightTime()) {
    fillRect(goodnight_rect.x, goodnight_rect.y, goodnight_rect.w, goodnight_rect.h, "rgb(60,60,100)");
    drawText("zzz", goodnight_rect.x + 8, goodnight_rect.y + 15, WHITE);
  }

  if (state.mood === 1) drawText("mood :   :)", 0, 63, GREEN);
  else if (state.mood === 2) drawText("mood :  :|", 0, 63, YELLOW);
  else if (state.mood === 3) drawText("mood :   >:{", 0, 63, RED);

  if (state.current_line) {
    const clampedX = Math.min(state.x, 600);
    drawWrappedText(state.current_line, clampedX, 430, 20, 22, state.lilguy_color);
  }

  drawText(text_surface, state.x, 450, state.lilguy_color);

  const v = weather_visuals[state.weather];
  if (v) {
    if (v.mode === "fall") {
      if (randInt(1, v.spawn_chance) === 1) {
        weather_particles.push([randInt(0, 800), randInt(250, 400)]);
      }
      weather_particles.forEach(p => {
        p[1] += v.speed;
        drawText(v.char, p[0], p[1], v.color);
      });
      weather_particles = weather_particles.filter(p => p[1] < 600);
    } else if (v.mode === "drift") {
      if (randInt(1, v.spawn_chance) === 1) {
        weather_particles.push([-20, randInt(260, 400)]);
      }
      weather_particles.forEach(p => {
        p[0] += v.speed;
        drawText("~~~", p[0], p[1], v.color);
      });
      weather_particles = weather_particles.filter(p => p[0] < 850);
    } else if (v.mode === "sun") {
      drawText("* SUN *", 680, 260, v.color);
    }
  } else {
    weather_particles = [];
  }

  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.lineTo(800, 250);
  ctx.stroke();

  drawText(state.mental_state, 0, 0, GREEN);
  drawText(String(Math.round(state.hunger)), 90, 23, RED);
  drawText("HUNGER=", 0, 23, RED);
  drawText(relationshipDescriptor(), 0, 43, GREEN);
  drawText("Gear: " + state.gear.length + " item" + (state.gear.length === 1 ? "" : "s"), 0, 83, WHITE);
  fillRect(exit_rect.x, exit_rect.y, exit_rect.w, exit_rect.h, RED);
  fillRect(feed_rect.x, feed_rect.y, feed_rect.w, feed_rect.h, BLUE);
  fillRect(idle_rect.x, idle_rect.y, idle_rect.w, idle_rect.h, ORANGE);
  ctx.restore();
}
