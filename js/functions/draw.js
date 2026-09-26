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
  
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.lineTo(800, 250);
  ctx.stroke();

  drawText("Gear: " + state.gear.length + " item" + (state.gear.length === 1 ? "" : "s"), 0, 83, WHITE);
  fillRect(exit_rect.x, exit_rect.y, exit_rect.w, exit_rect.h, RED);
  fillRect(feed_rect.x, feed_rect.y, feed_rect.w, feed_rect.h, BLUE);
  fillRect(idle_rect.x, idle_rect.y, idle_rect.w, idle_rect.h, ORANGE);
  ctx.restore();
}
