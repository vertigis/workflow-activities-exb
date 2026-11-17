/** @jsx jsx */
import { React, jsx, ThemeVariables, SerializedStyles, css, FormattedMessage } from 'jimu-core'
import { PanelHeader } from 'jimu-ui'
import defaultMessages from './translations/default'
import { WorkflowInfo } from '../config'
import { SettingRow } from 'jimu-ui/advanced/setting-components'
import { LinkTiltedOutlined } from 'jimu-icons/outlined/data/link-tilted'

interface TemplateProps {
  workflow: WorkflowInfo
  theme: ThemeVariables
  handleClosePanel: () => void
}

const WorkflowInfoPanel: React.FC<TemplateProps> = ({ workflow, theme, handleClosePanel }) => {
  const getStyle = (theme: ThemeVariables): SerializedStyles => {
    return css`
      .template-panel {
        padding: 0 1rem;
      }
      .template-panel .template-header .title {
        max-width: 80%;
      }
      .template {
        background-color: black;
        width: 100%;
        padding: 0.5rem;
        padding-top: 0;
        margin-top: 0.5rem;
      }
      .template-panel .template-input {
        width: 100%;
        margin-top: 0.25rem;
      }
      .template-label {
        padding: 0.25rem 0;
      }
      .designer-url {
        margin-right: 0.25rem;
      }
    `
  }
  return (
    <div className="w-100 h-100" css={getStyle(theme)}>
      <div className="template-panel">
        <PanelHeader
          level={1}
          className="py-3 template-inner"
          onClose={handleClosePanel}
          title={workflow.title}
        ></PanelHeader>
        <SettingRow>
          <a className="designer-url" href={workflow.itemUrl} target="_blank">
            <FormattedMessage
              id="vswf-viewItem"
              defaultMessage={defaultMessages['vswf-viewItem']}
            />
          </a>
          <LinkTiltedOutlined size={'s'} color="grey" />
        </SettingRow>
        <SettingRow>
          <a className="designer-url" href={workflow.designerURL} target="_blank">
            <FormattedMessage
              id="vswf-openInDesigner"
              defaultMessage={defaultMessages['vswf-openInDesigner']}
            />
          </a>
          <LinkTiltedOutlined size={'s'} color="grey" />
        </SettingRow>
      </div>
    </div>
  )
}

export default WorkflowInfoPanel
