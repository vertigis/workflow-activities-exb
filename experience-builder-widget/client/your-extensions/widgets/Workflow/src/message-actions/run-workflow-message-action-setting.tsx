/** @jsx jsx */
import {
  React,
  css,
  jsx,
  ActionSettingProps,
  SerializedStyles,
  ImmutableObject,
  IMThemeVariables,
  polished,
  getAppStore,
  Immutable,
  FormattedMessage
} from 'jimu-core'
import { SettingSection, SettingRow, SidePopper } from 'jimu-ui/advanced/setting-components'
import defaultMessages from '../setting/translations/default'
import { withTheme } from 'jimu-theme'
import { Parameter, WorkflowInfo } from '../config'
import { Button, Option, Select } from 'jimu-ui'
import Params from '../setting/params'
import { useLayoutEffect, useRef, useState } from 'react'

interface ExtraProps {
  theme?: IMThemeVariables
}

interface Config {
  workflow: WorkflowInfo
  parameters: Parameter[]
  widgetId: string
}

export type IMActionConfig = ImmutableObject<Config>

// Remove types on side popper to silence react typing error.
const SidePopperNoTypes = SidePopper as any

// React 19 ignores defaultProps on function components, so fall back to this instead.
const defaultConfig: IMActionConfig = Immutable({
  workflow: undefined,
  parameters: [],
  widgetId: ''
})

const RunWorkflowActionSetting: React.FC<
  ActionSettingProps<IMActionConfig> & ExtraProps
> = props => {
  const config = props.config ?? defaultConfig
  const [showParamPanel, setShowParamPanel] = useState<boolean>(false)
  const [widgetConfig, setWidgetConfig] = useState<any>()
  const sidePanelRef = useRef<HTMLDivElement>(null)

  const getWidgetConfig = () => {
    const appState = getAppStore().getState()
    const widgetConfig =
      appState.appStateInBuilder.appConfig.widgets.asMutable()[props.widgetId].config
    changeSetting('workflow', widgetConfig.workflowInfo)
    setWidgetConfig(widgetConfig)
  }

  useLayoutEffect(() => {
    getWidgetConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeSetting = (key: string, value: any) => {
    props.onSettingChange({
      config: config.set(key, value),
      actionId: props.actionId
    })
  }

  const getSelectedWorkflowIndex = () => {
    const selectedWorkflowId = config.workflow?.id
    if (!selectedWorkflowId) {
      return -1
    }
    if (selectedWorkflowId === widgetConfig?.workflowInfo.id) {
      return 0
    }
    // Not found (or no allowed workflows) falls back to the widget's main workflow at index 0.
    return (widgetConfig?.allowedWorkflows?.findIndex(wf => wf.id === selectedWorkflowId) ?? -1) + 1
  }

  const handleWorkflowChange = e => {
    const workflowIndex = e.target.value
    let workflow
    if (workflowIndex === 0) {
      workflow = widgetConfig?.workflowInfo
    } else if (workflowIndex > 0) {
      workflow = widgetConfig?.allowedWorkflows?.[workflowIndex - 1]
    }

    changeSetting('workflow', workflow)
  }

  const handleConfigureParametersClick = () => {
    setShowParamPanel(true)
  }

  const handleChangeParam = (index: number, value: Parameter) => {
    const params = config.parameters.asMutable()
    params[index] = Immutable(value)

    changeSetting('parameters', params)
  }

  const handleRemoveParam = (index: number) => {
    const params = config.parameters.filter((item, i) => i !== index)

    changeSetting('parameters', params)
  }

  const handleAddParameter = () => {
    const params = config.parameters?.asMutable() ?? []
    params.push(Immutable({ key: '', value: '' }))

    changeSetting('parameters', params)
  }

  function getStyle(theme: IMThemeVariables): SerializedStyles {
    return css`
      .setting-header {
        padding: ${polished.rem(10)} ${polished.rem(16)} ${polished.rem(0)} ${polished.rem(16)};
      }

      .deleteIcon {
        cursor: pointer;
        opacity: 0.8;
      }

      .deleteIcon:hover {
        opacity: 1;
      }
    `
  }

  return (
    <div css={getStyle(props.theme)} ref={sidePanelRef} style={{ width: '100%' }}>
      <SettingSection
        title={props.intl.formatMessage({
          id: 'vswf-workflow-settings',
          defaultMessage: defaultMessages['vswf-workflow-settings']
        })}
      >
        <SettingRow
          label={props.intl.formatMessage({
            id: 'vswf-workflow',
            defaultMessage: defaultMessages['vswf-workflow']
          })}
        ></SettingRow>
        <SettingRow>
          <Select value={getSelectedWorkflowIndex()} onChange={handleWorkflowChange}>
            <Option key={0} value={0}>
              {widgetConfig?.workflowInfo.title}
            </Option>
            {widgetConfig?.allowedWorkflows?.map((wf, id) => (
              <Option key={id + 1} value={id + 1}>
                {wf.title}
              </Option>
            ))}
          </Select>
        </SettingRow>
      </SettingSection>
      <SettingSection
        title={
          <FormattedMessage
            id="vswf-parameters"
            defaultMessage={defaultMessages['vswf-parameters']}
          />
        }
      >
        <SettingRow>
          <Button
            className="w-100 text-dark set-link-btn add-parameter-button"
            type="primary"
            onClick={handleConfigureParametersClick}
            block
          >
            <FormattedMessage
              id="vswf-configureParams"
              defaultMessage={defaultMessages['vswf-configureParams']}
            />
          </Button>
        </SettingRow>
      </SettingSection>
      <SidePopperNoTypes
        isOpen={showParamPanel}
        position="right"
        toggle={() => setShowParamPanel(false)}
        trigger={sidePanelRef.current}
      >
        <Params
          params={config.parameters?.asMutable()}
          theme={props.theme}
          handleCloseParams={() => setShowParamPanel(false)}
          handleAddParam={handleAddParameter}
          handleChangeParam={handleChangeParam}
          handleRemoveParam={handleRemoveParam}
        />
      </SidePopperNoTypes>
    </div>
  )
}

export default withTheme(RunWorkflowActionSetting)
