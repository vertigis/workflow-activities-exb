/** @jsx jsx */
import { React, jsx, ThemeVariables, SerializedStyles, css, FormattedMessage } from 'jimu-core'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { Button, PanelHeader, Input } from 'jimu-ui'
import { Parameter } from '../config'
import defaultMessages from './translations/default'
import { TrashOutlined } from 'jimu-icons/outlined/editor/trash'

interface ParamsProps {
  params: Parameter[]
  theme: ThemeVariables
  handleCloseParams: () => void
  handleAddParam: () => void
  handleChangeParam: (index: number, value: Parameter) => void
  handleRemoveParam: (index: number) => void
}

const Params: React.FC<ParamsProps> = ({
  params,
  theme,
  handleCloseParams,
  handleAddParam,
  handleChangeParam,
  handleRemoveParam
}) => {
  const changeKey = (index: number, key: string) => {
    const newParam = { ...params[index], key }
    handleChangeParam(index, newParam)
  }

  const changeValue = (index: number, value: string) => {
    const newParam = { ...params[index], value }
    handleChangeParam(index, newParam)
  }

  const getStyle = (theme: ThemeVariables): SerializedStyles => {
    return css`
      .error {
        background-color: rgb(244 226 226);
        box-shadow: 0 0 0 1px #b22222 inset;
        border-color: #b22222;
      }
      .param-panel {
        padding: 0 1rem;
      }
      .param-panel .panel-header .title {
        max-width: 80%;
      }
      .param {
        background-color: black;
        width: 100%;
        padding: 0.5rem;
        padding-top: 0;
        margin-top: 0.5rem;
      }
      .params {
        overflow-y: auto;
        max-height: 90%;
        margin-top: 1rem;
      }
      .param-input {
        width: 100%;
        border-radius: 0.25rem;
      }
      .param-key {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .param-label {
        padding: 0.25rem 0;
        height: 2.5rem;
        display: flex;
        align-items: center;
      }
      .param-remove {
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .param-remove:hover {
        background-color: #282828;
      }
    `
  }
  return (
    <div className="w-100 h-100" css={getStyle(theme)}>
      <div className="param-panel w-100 h-100">
        <PanelHeader
          level={1}
          className="py-3 panel-inner"
          onClose={handleCloseParams}
          title={
            <FormattedMessage
              id="vswf-configureParams"
              defaultMessage={defaultMessages['vswf-configureParams']}
            />
          }
        ></PanelHeader>
        <SettingRow>
          <Button
            className="w-100 text-dark set-link-btn add-parameter-button"
            type="primary"
            block
            onClick={handleAddParam}
          >
            <FormattedMessage
              id="vswf-addParam"
              defaultMessage={defaultMessages['vswf-addParam']}
            />
          </Button>
        </SettingRow>
        <div className="params">
          {params?.map((p, i) => (
            <div className="param">
              <div className="name">
                <div className="setting-text-level-3 param-label param-key">
                  <FormattedMessage id="vswf-name" defaultMessage={defaultMessages['vswf-name']} />
                  <div className="param-remove" onClick={() => handleRemoveParam(i)}>
                    <TrashOutlined />
                  </div>
                </div>
                <Input
                  value={p.key}
                  className={
                    !p.key || params.filter(param => p.key === param.key).length > 1
                      ? 'error param-input'
                      : 'param-input'
                  }
                  onChange={event => changeKey(i, event.target.value)}
                />
              </div>
              <div className="value">
                <div className="setting-text-level-3 param-label">
                  <FormattedMessage
                    id="vswf-value"
                    defaultMessage={defaultMessages['vswf-value']}
                  />
                </div>
                <Input
                  value={p.value}
                  className="param-input"
                  onChange={event => changeValue(i, event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Params
