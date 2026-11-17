import { ImmutableObject } from 'seamless-immutable'

export type StartOp = 'onClick' | 'onStart' | 'onOpen' | 'onEvent'

export interface Config {
  workflowInfo: WorkflowInfo
  workflowParameters: Parameter[]
  startOperation: StartOp
  showIcon: boolean
  actionListener: any
  showFormTitle: boolean
  allowedWorkflows: WorkflowInfo[]
  printingServiceUrl?: string
}

export interface WorkflowInfo {
  designerURL: string
  id: string
  owner: string
  title: string
  itemUrl: string
}

export interface Parameter {
  key: string
  value: any
}

export type IMConfig = ImmutableObject<Config>
