import React, { memo } from 'react';
import { sqrt, add, multiply, pow, divide, re, Complex } from 'mathjs';
import { EdgeProps, Position } from '../../types';
import BaseEdge from './BaseEdge';
import { getCenter } from './utils';

export interface GetBezierPathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
  stub?: number;
  centerX?: number;
  centerY?: number;
}

interface GetControlWithCurvatureParams {
  pos: Position;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  s: number;
}

function calculateControlOffset(distance: number, stub: number): number {
  const criticalPoint = 2 * stub;
  if (distance >= criticalPoint) {
    return Math.max(0.5 * distance, criticalPoint);
  } else {
    const temp0 = distance - criticalPoint;
    const temp1 = temp0 * temp0;
    const temp2 = pow(multiply(temp1, add(distance, multiply(2, sqrt((distance - stub) * stub)))), 1 / 3);
    return re(add(add(divide(temp1, temp2), temp2), distance) as Complex) as number;
  }
}

function getControlWithCurvature({ pos, x1, y1, x2, y2, s }: GetControlWithCurvatureParams): [number, number] {
  let ctX: number, ctY: number;
  switch (pos) {
    case Position.Left:
      {
        ctY = y1;
        ctX = x1 - calculateControlOffset(x1 - x2, s);
      }
      break;
    case Position.Right:
      {
        ctY = y1;
        ctX = x1 + calculateControlOffset(x2 - x1, s);
      }
      break;
    case Position.Top:
      {
        ctX = x1;
        ctY = y1 - calculateControlOffset(y1 - y2, s);
      }
      break;
    case Position.Bottom:
      {
        ctX = x1;
        ctY = y1 + calculateControlOffset(y2 - y1, s);
      }
      break;
  }
  return [ctX, ctY];
}

export function getBezierPath({
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
  stub = 10,
  centerX,
  centerY,
}: GetBezierPathParams): string {
  const [_centerX, _centerY] = getCenter({ sourceX, sourceY, targetX, targetY });
  centerX = centerX ?? _centerX;
  centerY = centerY ?? _centerY;
  const [sourceControlX, sourceControlY] = getControlWithCurvature({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    s: stub,
  });
  const [targetControlX, targetControlY] = getControlWithCurvature({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY,
    s: stub,
  });
  return `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;
}

export default memo(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Bottom,
    targetPosition = Position.Top,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    style,
    markerEnd,
    markerStart,
    stub,
  }: EdgeProps) => {
    const [centerX, centerY] = getCenter({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    const path = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      stub,
    });

    return (
      <BaseEdge
        path={path}
        centerX={centerX}
        centerY={centerY}
        label={label}
        labelStyle={labelStyle}
        labelShowBg={labelShowBg}
        labelBgStyle={labelBgStyle}
        labelBgPadding={labelBgPadding}
        labelBgBorderRadius={labelBgBorderRadius}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
    );
  }
);
