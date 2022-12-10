import { Query, System } from '@arancini/core';
import {
  CanvasContext,
  Circle,
  Intersecting,
  Movement,
} from './components';
import { drawLine, fillCircle, intersection } from './utils';

const Queries = {
  MovingCircles: [Movement, Circle],
  Context: [CanvasContext],
  Circles: [Circle],
  Intersecting: [Intersecting],
};

export class MovementSystem extends System {
  movingCircles = this.query(Queries.MovingCircles);
  context = this.query(Queries.Context);

  onUpdate(delta: number) {
    const context = this.context.first!;

    let canvasWidth = context.get(CanvasContext).width;
    let canvasHeight = context.get(CanvasContext).height;
    let multiplier = 0.5;

    let entities = this.movingCircles.entities;
    for (let i = 0; i < entities.length; i++) {
      let entity = entities[i];
      let circle = entity.get(Circle);
      let movement = entity.get(Movement);

      circle.position.x +=
        movement.velocity.x * movement.acceleration.x * delta * multiplier;
      circle.position.y +=
        movement.velocity.y * movement.acceleration.y * delta * multiplier;

      if (movement.acceleration.x > 1)
        movement.acceleration.x -= delta * multiplier;
      if (movement.acceleration.y > 1)
        movement.acceleration.y -= delta * multiplier;
      if (movement.acceleration.x < 1) movement.acceleration.x = 1;
      if (movement.acceleration.y < 1) movement.acceleration.y = 1;

      if (circle.position.y + circle.radius < 0)
        circle.position.y = canvasHeight + circle.radius;

      if (circle.position.y - circle.radius > canvasHeight)
        circle.position.y = -circle.radius;

      if (circle.position.x - circle.radius > canvasWidth)
        circle.position.x = 0;

      if (circle.position.x + circle.radius < 0)
        circle.position.x = canvasWidth;
    }
  }
}

export class IntersectionSystem extends System {
  circles!: Query;

  onInit() {
    this.circles = this.query(Queries.Circles);
  }

  onUpdate() {
    let entities = this.circles.entities;

    for (let i = 0; i < entities.length; i++) {
      let entity = entities[i];
      if (entity.has(Intersecting)) {
        entity.get(Intersecting).points.length = 0;
      }

      let circle = entity.get(Circle);

      for (let j = i + 1; j < entities.length; j++) {
        let entityB = entities[j];
        let circleB = entityB.get(Circle);

        const intersect = intersection(circle, circleB);
        if (intersect !== false) {
          if (!entity.has(Intersecting)) {
            entity.add(Intersecting);
          }
          const intersectComponent = entity.get(Intersecting);
          intersectComponent.points.push(intersect);
        }
      }
      if (
        entity.has(Intersecting) &&
        entity.get(Intersecting).points.length === 0
      ) {
        entity.remove(Intersecting);
      }
    }
  }

  onDestroy() {
    // Clean up interesection when stopping
    let entities = this.circles.entities;

    for (let i = 0; i < entities.length; i++) {
      let entity = entities[i];
      if (entity.has(Intersecting)) {
        entity.get(Intersecting).points.length = 0;
      }
    }
  }
}

export class Renderer extends System {
  circles = this.query(Queries.Circles);
  intersectingCircles = this.query(Queries.Intersecting);
  context =  this.query(Queries.Context);
  
  onUpdate() {
    const context = this.context.first!;
    let canvasComponent = context.get(CanvasContext);
    let ctx = canvasComponent.ctx;
    let canvasWidth = canvasComponent.width;
    let canvasHeight = canvasComponent.height;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let circles = this.circles.entities;
    for (let i = 0; i < circles.length; i++) {
      let circle = circles[i].get(Circle);

      ctx.beginPath();
      ctx.arc(
        circle.position.x,
        circle.position.y,
        circle.radius,
        0,
        2 * Math.PI,
        false
      );
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }

    let intersectingCircles = this.intersectingCircles.entities;
    for (let i = 0; i < intersectingCircles.length; i++) {
      let intersect = intersectingCircles[i].get(Intersecting);
      for (let j = 0; j < intersect.points.length; j++) {
        const points = intersect.points[j];
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ff9';

        ctx.fillStyle = 'rgba(255, 255,255, 0.2)';
        fillCircle(ctx, points[0], points[1], 8);
        fillCircle(ctx, points[2], points[3], 8);

        ctx.fillStyle = '#fff';
        fillCircle(ctx, points[0], points[1], 3);
        fillCircle(ctx, points[2], points[3], 3);

        drawLine(ctx, points[0], points[1], points[2], points[3]);
      }
    }
  }
}
