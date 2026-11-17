/** @jsx jsx */
import {
  React,
  css,
  jsx,
  SerializedStyles,
  ImmutableObject,
  IMThemeVariables,
  polished,
  Immutable,
  FormattedMessage,
  DataActionSettingProps
} from 'jimu-core'
import { SettingSection, SettingRow, SidePopper } from 'jimu-ui/advanced/setting-components'
import defaultMessages from '../setting/translations/default'
import { withTheme } from 'jimu-theme'
import { Parameter } from '../config'
import { Button } from 'jimu-ui'
import Params from '../setting/params'
import { useRef, useState } from 'react'

interface ExtraProps {
  theme?: IMThemeVariables
}

interface Config {
  parameters: Parameter[]
  widgetId: string
}

export type IMActionConfig = ImmutableObject<Config>

// Remove types on side popper to silence react typing error.
const SidePopperNoTypes = SidePopper as any

// React 19 ignores defaultProps on function components, so fall back to this instead.
const defaultConfig: IMActionConfig = Immutable({
  parameters: [],
  widgetId: ''
})

const RunWorkflowActionSetting: React.FC<
  DataActionSettingProps<IMActionConfig> & ExtraProps
> = props => {
  const config = props.config ?? defaultConfig
  const [showParamPanel, setShowParamPanel] = useState<boolean>(false)
  const sidePanelRef = useRef<HTMLDivElement>(null)

  const changeSetting = (key: string, value: any) => {
    props.onSettingChange({ ...config.set(key, value) })
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
        title={
          <FormattedMessage
            id="vswf-workflow-settings"
            defaultMessage={defaultMessages['vswf-workflow-settings']}
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
