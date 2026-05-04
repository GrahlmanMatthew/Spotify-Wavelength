import * as d3 from 'd3'
import type { GraphEdge } from './edges'
import type { GraphNode } from './nodes'

export interface SimulationConfig {
  width: number
  height: number
  onTick: () => void
  onEnd: () => void
}

export interface SimulationHandle {
  restart: (nodes: GraphNode[], edges: GraphEdge[]) => void
  stop: () => void
}

export function createSimulation(config: SimulationConfig): SimulationHandle {
  const { width, height, onTick, onEnd } = config

  const simulation = d3
    .forceSimulation<GraphNode>()
    .force('charge', d3.forceManyBody<GraphNode>().strength(-600).distanceMin(30).distanceMax(800))
    .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
    .force('collide', d3.forceCollide<GraphNode>().radius((d) => d.size + 18).strength(1))
    .alphaDecay(0.02)
    .velocityDecay(0.4)
    .on('tick', onTick)
    .on('end', onEnd)

  function restart(nodes: GraphNode[], edges: GraphEdge[]): void {
    const linkForce = d3
      .forceLink<GraphNode, GraphEdge>(edges)
      .id((d) => d.id)
      .distance((link) => Math.max(120, 320 - (link.weight - 1) * 20))
      .strength(0.2)

    simulation.nodes(nodes).force('link', linkForce).alpha(1).restart()
  }

  function stop(): void {
    simulation.stop()
  }

  return { restart, stop }
}
