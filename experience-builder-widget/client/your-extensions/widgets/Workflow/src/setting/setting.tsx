/** @jsx jsx */
import {
  AllDataSourceTypes,
  css,
  FormattedMessage,
  Immutable,
  type IMThemeVariables,
  jsx,
  React,
  type SerializedStyles,
  type UseDataSource
} from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { LinkTiltedOutlined } from 'jimu-icons/outlined/data/link-tilted'
import { TrashOutlined } from 'jimu-icons/outlined/editor/trash'
import { HelpOutlined } from 'jimu-icons/outlined/suggested/help'
import { Alert, Button, Input, Option, Select, Switch, Tooltip } from 'jimu-ui'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import {
  MapWidgetSelector,
  SettingRow,
  SettingSection,
  SidePopper
} from 'jimu-ui/advanced/setting-components'
import { List, type TreeItemsType, type TreeItemType } from 'jimu-ui/basic/list-tree'
import { useRef, useState } from 'react'
import PortalExplorer from '../../../shared/components/PortalExplorer'
import { type IMConfig, type Parameter, type WorkflowInfo } from '../config'
import DEFAULT_PORTAL_ITEM_IMAGE from '../runtime/assets/default-thumbnail.png'
import Params from './params'
import defaultMessages from './translations/default'
import WorkflowInfoPanel from './workflowInfo'

type PortalExplorerPurpose = 'action' | 'default'

export const Setting: React.FC<AllWidgetSettingProps<IMConfig>> = props => {
  const [showItems, setShowItems] = useState<boolean>(false)
  const [showParamPanel, setShowParamPanel] = useState<boolean>(false)
  const [portalExplorerPurpose, setPortalExplorerPurpose] = useState<PortalExplorerPurpose>()
  const [showWorkflowInfo, setShowWorkflowInfo] = useState<number>(-1)
  const sidePanelRef = useRef<HTMLDivElement>(null)

  const supportedDsTypes = Immutable([
    AllDataSourceTypes.FeatureLayer,
    AllDataSourceTypes.FeatureService
  ])
  let integratedDataSourceSetting = {} as any

  const getItemUrl = (item: any) => {
    return `${props.portalUrl}/home/item.html?id=${item.id}`
  }

  const handleOpenPanel = async () => {
    setPortalExplorerPurpose('default')
    setShowItems(true)
  }

  const onMapWidgetSelected = (mapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: mapWidgetIds
    })
  }

  const onDataSourceChange = (useDataSources: UseDataSource[]) => {
    if (!useDataSources) {
      return
    }

    if (!props.useDataSources || useDataSources.length === props.useDataSources.length) {
      props.onSettingChange({
        id: props.id,
        useDataSources: useDataSources
      })
    } else if (useDataSources.length > props.useDataSources.length) {
      const currentSelectedDs = useDataSources.find(
        ds => !props.useDataSources.some(uDs => uDs.dataSourceId === ds.dataSourceId)
      )
      onDataSourceSelected(currentSelectedDs)
    } else {
      const currentRemovedDs = props.useDataSources.find(
        uDs => !useDataSources.some(ds => uDs.dataSourceId === ds.dataSourceId)
      )
      onDataSourceRemoved(currentRemovedDs)
    }
  }

  const onDataSourceSelected = (currentSelectedDs: UseDataSource): void => {
    if (!currentSelectedDs) {
      return
    }

    let tempUseDataSources = []
    tempUseDataSources = Object.assign(tempUseDataSources, props.useDataSources)
    tempUseDataSources.push(currentSelectedDs)

    integratedDataSourceSetting = {
      id: props.id,
      useDataSources: Immutable(tempUseDataSources)
    }

    const settingOption = Object.assign({}, integratedDataSourceSetting)

    settingOption.config = props.config
      .set('initialDataSourceID', currentSelectedDs.dataSourceId)
      .set('isUseCustomState', false)
      .set('initialState', null)
    props.onSettingChange(settingOption)
  }

  const onDataSourceRemoved = (currentRemovedDs: UseDataSource): void => {
    if (!currentRemovedDs) {
      return
    }

    const removedDatasourceId = currentRemovedDs.dataSourceId

    // remove related useDataSource
    let tempUseDataSources: UseDataSource[] = []
    tempUseDataSources = Object.assign(tempUseDataSources, props.useDataSources)
    for (let i = 0; i < tempUseDataSources.length; i++) {
      if (tempUseDataSources[i].dataSourceId === removedDatasourceId) {
        tempUseDataSources.splice(i, 1)
        break
      }
    }

    const settingChange = {
      id: props.id,
      useDataSources: Immutable(tempUseDataSources)
    } as any

    let settingOption = {} as any

    integratedDataSourceSetting = settingChange
    settingOption = Object.assign({}, integratedDataSourceSetting)
    if (tempUseDataSources.length > 0) {
      const initialMapDataSourceID = tempUseDataSources[0] && tempUseDataSources[0].dataSourceId
      settingOption.config = props.config
        .set('initialDataSourceID', initialMapDataSourceID)
        .set('isUseCustomState', false)
        .set('initialState', null)
    } else {
      settingOption.config = props.config
        .set('initialDataSourceID', null)
        .set('isUseCustomState', false)
        .set('initialState', null)
    }

    props.onSettingChange(Object.assign({}, settingOption))
  }

  const onDisableSelection = (useDataSources: UseDataSource[]): boolean => {
    return false
  }

  const handleClosePanel = () => {
    setShowItems(false)
    setPortalExplorerPurpose(undefined)
  }

  const setDefaultWorkflow = (workflow: WorkflowInfo) => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set('workflowInfo', workflow)
    })
  }

  const addActionWorkflow = (workflow: WorkflowInfo) => {
    const allowedWorkflows = props.config.allowedWorkflows?.asMutable() ?? []
    allowedWorkflows.push(Immutable(workflow))
    props.onSettingChange({
      id: props.id,
      config: props.config.set('allowedWorkflows', allowedWorkflows)
    })
  }

  const handlePortalExplorerSubmit = (item: any) => {
    const newWorkflow = {
      designerURL: item.url,
      id: item.id,
      itemUrl: getItemUrl(item),
      owner: item.owner,
      title: item.title
    }

    switch (portalExplorerPurpose) {
      case 'default':
        setDefaultWorkflow(newWorkflow)
        break
      case 'action':
        addActionWorkflow(newWorkflow)
        break
    }
    handleClosePanel()
  }

  const handleChangeShowFormTitle = () => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set('showFormTitle', !props.config.showFormTitle)
    })
  }

  const handleChangeShowIcon = () => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set('showIcon', !props.config.showIcon)
    })
  }

  const handleChangePrintingServiceUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set('printingServiceUrl', event.target.value)
    })
  }

  const handleChangeStartOperation = (event: { target: { value: string } }) => {
    if (event.target.value === 'onClick') {
      props.onSettingChange({
        id: props.id,
        config: props.config.set('startOperation', event.target.value).set('showIcon', true)
      })
    } else {
      props.onSettingChange({
        id: props.id,
        config: props.config.set('startOperation', event.target.value)
      })
    }
  }

  const handleConfigureParametersClick = () => {
    setShowParamPanel(true)
    setShowWorkflowInfo(-1)
  }

  const handleChangeParam = (index: number, value: Parameter) => {
    const params = props.config.workflowParameters.asMutable()
    params[index] = Immutable(value)
    props.onSettingChange({
      id: props.id,
      config: props.config.set('workflowParameters', params)
    })
  }

  const handleRemoveParam = (index: number) => {
    const params = props.config.workflowParameters.filter((item, i) => i !== index)
    props.onSettingChange({
      id: props.id,
      config: props.config.set('workflowParameters', params)
    })
  }

  const handleAddParameter = () => {
    const params = props.config.workflowParameters.asMutable()
    params.push(Immutable({ key: '', value: '' }))
    props.onSettingChange({
      id: props.id,
      config: props.config.set('workflowParameters', params)
    })
  }

  const handleAddActionWorkflowClick = () => {
    setPortalExplorerPurpose('action')
    setShowItems(true)
  }

  const removeActionWorkflow = (index: number) => {
    const actionWorkflows = props.config.allowedWorkflows.asMutable()
    actionWorkflows.splice(index, 1)
    props.onSettingChange({
      id: props.id,
      config: props.config.set('allowedWorkflows', actionWorkflows)
    })
    setShowWorkflowInfo(-1)
  }

  const onActionWorkflowUpdated = (parentItemJson: TreeItemsType) => {
    const { id, config } = props
    const newTemplates = parentItemJson.map(item => {
      return item.itemStateDetailContent
    })
    const newConfig = {
      id,
      config: config.set('allowedWorkflows', newTemplates)
    }
    setShowWorkflowInfo(-1)
    props.onSettingChange(newConfig)
  }

  const getStyle = (theme: IMThemeVariables): SerializedStyles => {
    return css`
      .widget-setting-workflow {
        .designer-url {
          margin-right: 0.25rem;
        }

        .start-operation-help {
          border-radius: 50%;
          background: transparent;
          height: 1.5rem;
          width: 1.5rem;
          border: 0;
          span: {
            min-height: 0;
            min-width: 0;
          }
        }

        .add-parameter-button {
          margin-bottom: 0.5rem;
        }

        .params-list {
          padding: 0.5rem;
          padding-bottom: 0;
          background: ${theme.ref.palette.secondary[400]};
        }
      }
    `
  }

  return (
    <div css={getStyle(props.theme)}>
      <div className="jimu-widget-setting widget-setting-workflow" ref={sidePanelRef}>
        <SettingSection
          title={
            <FormattedMessage
              id="vswf-workflow"
              defaultMessage={defaultMessages['vswf-workflow']}
            />
          }
        >
          <SettingRow>
            <Button
              className="w-100 text-dark set-link-btn"
              type="primary"
              onClick={handleOpenPanel}
              block
            >
              <div className="w-100 text-truncate">
                {props.config.workflowInfo.id !== '' && (
                  <FormattedMessage
                    id="vswf-changeWorkflow"
                    defaultMessage={defaultMessages['vswf-changeWorkflow']}
                  />
                )}
                {!props.config.workflowInfo.id && (
                  <FormattedMessage
                    id="vswf-selectWorkflow"
                    defaultMessage={defaultMessages['vswf-selectWorkflow']}
                  />
                )}
              </div>
            </Button>
          </SettingRow>
          {props.config.workflowInfo.id !== '' && (
            <React.Fragment>
              <SettingRow
                label={
                  <FormattedMessage
                    id="workflowName"
                    defaultMessage={props.config.workflowInfo.title}
                  />
                }
              ></SettingRow>
              <SettingRow>
                <a
                  className="designer-url"
                  href={props.config.workflowInfo.itemUrl}
                  target="_blank"
                >
                  <FormattedMessage
                    id="vswf-viewItem"
                    defaultMessage={defaultMessages['vswf-viewItem']}
                  />
                </a>
                <LinkTiltedOutlined size={'s'} />
              </SettingRow>
              <SettingRow>
                <a
                  className="designer-url"
                  href={props.config.workflowInfo.designerURL}
                  target="_blank"
                >
                  <FormattedMessage
                    id="vswf-openInDesigner"
                    defaultMessage={defaultMessages['vswf-openInDesigner']}
                  />
                </a>
                <LinkTiltedOutlined size={'s'} />
              </SettingRow>
            </React.Fragment>
          )}
        </SettingSection>
        <SettingSection
          className="map-selector-section"
          title={<FormattedMessage id="vswf-data" defaultMessage={defaultMessages['vswf-data']} />}
        >
          <SettingRow
            label={
              <FormattedMessage
                id="vswf-mapWidget"
                defaultMessage={defaultMessages['vswf-mapWidget']}
              />
            }
          ></SettingRow>
          <SettingRow>
            <MapWidgetSelector
              onSelect={onMapWidgetSelected}
              useMapWidgetIds={props.useMapWidgetIds}
            />
          </SettingRow>
          <SettingRow
            label={
              <FormattedMessage
                id="vswf-dataSources"
                defaultMessage={defaultMessages['vswf-dataSources']}
              />
            }
          ></SettingRow>
          <SettingRow>
            <DataSourceSelector
              isMultiple
              types={supportedDsTypes}
              buttonLabel={props.intl.formatMessage({
                id: 'vswf-setDataSources',
                defaultMessage: defaultMessages['vswf-setDataSources']
              })}
              onChange={onDataSourceChange}
              useDataSources={props.useDataSources}
              disableSelection={onDisableSelection}
              mustUseDataSource
              widgetId={props.id}
            />
          </SettingRow>
        </SettingSection>
        <SettingSection
          className="general-settings-section"
          title={
            <FormattedMessage
              id="vswf-generalSettings"
              defaultMessage={defaultMessages['vswf-generalSettings']}
            />
          }
        >
          <SettingRow
            label={
              <FormattedMessage
                id="vswf-showFormTitle"
                defaultMessage={defaultMessages['vswf-showFormTitle']}
              />
            }
          >
            <Switch
              checked={props.config.showFormTitle}
              data-key="showFormTitle"
              onChange={handleChangeShowFormTitle}
            />
          </SettingRow>
          <SettingRow
            label={
              <FormattedMessage
                id="vswf-startOperation"
                defaultMessage={defaultMessages['vswf-startOperation']}
              />
            }
          >
            <Tooltip
              arrowStyle={{
                background: 'var(--info-100)',
                border: {
                  color: 'var(--info-300)',
                  width: '1px'
                },
                size: 8
              }}
              placement="top"
              title={
                <Alert form="basic" type="info">
                  {/* Alert's text prop only accepts a string, so pass the rich message as children. */}
                  <div className="jimu-alert-panel-description">
                    {props.intl.formatMessage(
                      {
                        id: 'vswf-startOperationHelp',
                        defaultMessage: defaultMessages['vswf-startOperationHelp']
                      },
                      {
                        br: (
                          <React.Fragment>
                            <br />
                            <br />
                          </React.Fragment>
                        )
                      }
                    )}
                  </div>
                </Alert>
              }
            >
              <Button icon className="start-operation-help">
                <HelpOutlined size={'s'} />
              </Button>
            </Tooltip>
          </SettingRow>
          <SettingRow>
            <Select
              value={props.config.startOperation}
              data-key="startOperation"
              onChange={handleChangeStartOperation}
            >
              <Option key={'onStart'} value={'onStart'}>
                <FormattedMessage id="vswf-start" defaultMessage={defaultMessages['vswf-start']} />
              </Option>
              <Option key={'onClick'} value={'onClick'}>
                <FormattedMessage id="vswf-click" defaultMessage={defaultMessages['vswf-click']} />
              </Option>
              <Option key={'onOpen'} value={'onOpen'}>
                <FormattedMessage id="vswf-open" defaultMessage={defaultMessages['vswf-open']} />
              </Option>
              <Option key={'onEvent'} value={'onEvent'}>
                <FormattedMessage id="vswf-event" defaultMessage={defaultMessages['vswf-event']} />
              </Option>
            </Select>
          </SettingRow>
          <SettingRow
            label={
              <FormattedMessage
                id="vswf-showIcon"
                defaultMessage={defaultMessages['vswf-showIcon']}
              />
            }
          >
            <Switch
              checked={props.config.showIcon || props.config.startOperation === 'onClick'}
              data-key="showIcon"
              onChange={handleChangeShowIcon}
              disabled={props.config.startOperation === 'onClick'}
            />
          </SettingRow>
          <SettingRow
            flow="wrap"
            label={
              <FormattedMessage
                id="vswf-printingServiceUrl"
                defaultMessage={defaultMessages['vswf-printingServiceUrl']}
              />
            }
          >
            <Input
              value={props.config.printingServiceUrl}
              data-key="printingServiceUrl"
              style={{ width: '100%' }}
              onChange={handleChangePrintingServiceUrl}
            />
          </SettingRow>
        </SettingSection>
        {props.config.workflowInfo.id !== '' && [
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
          </SettingSection>,
          <SettingSection
            title={
              <FormattedMessage
                id="vswf-message-action-workflows"
                defaultMessage={defaultMessages['vswf-message-action-workflows']}
              />
            }
          >
            <SettingRow>
              <Button
                className="w-100 text-dark set-link-btn add-parameter-button"
                type="primary"
                onClick={handleAddActionWorkflowClick}
                block
              >
                <FormattedMessage
                  id="vswf-add-message-action-workflow"
                  defaultMessage={defaultMessages['vswf-add-message-action-workflow']}
                />
              </Button>
            </SettingRow>
            <List
              itemsJson={Array.from(props.config.allowedWorkflows ?? []).map((workflow, i) => ({
                itemStateDetailContent: workflow,
                itemKey: `${i}`,
                itemStateTitle: workflow.title,
                itemStateCommands: [
                  {
                    label: props.intl.formatMessage({
                      id: 'vswf-remove',
                      defaultMessage: defaultMessages['vswf-remove']
                    }),
                    iconProps: () => ({ icon: TrashOutlined, size: 12 }),
                    action: () => {
                      removeActionWorkflow(i)
                    }
                  }
                ]
              }))}
              onUpdateItem={(_actionData, refComponent) => {
                const { itemJsons } = refComponent.props
                // itemJsons is [current item, sibling items], but is typed as a flat item array.
                const [, parentItemJson] = itemJsons as unknown as [TreeItemType, TreeItemsType]
                onActionWorkflowUpdated(parentItemJson)
              }}
              renderOverrideItemDetailToggle={() => null}
              onClickItemBody={(_actionData, refComponent) => {
                const {
                  itemJsons: [currentItemJson]
                } = refComponent.props
                setShowWorkflowInfo(+currentItemJson.itemKey)
                setShowParamPanel(false)
              }}
            />
          </SettingSection>
        ]}
        <PortalExplorer
          defaultImage={DEFAULT_PORTAL_ITEM_IMAGE}
          formatMessage={props.intl.formatMessage}
          isOpen={showItems}
          language={defaultMessages}
          languagePrefix="vswf"
          onClose={handleClosePanel}
          onChoose={handlePortalExplorerSubmit}
          portalSelf={props.portalSelf}
          portalUrl={props.portalUrl}
          theme={props.theme}
          token={props.token}
          typekeywords={'"Geocortex Workflow"'}
          widgetName="Workflow"
          user={props.user}
        />
      </div>
      <SidePopper
        isOpen={showParamPanel}
        position="right"
        toggle={() => {
          setShowParamPanel(false)
        }}
        trigger={sidePanelRef.current}
      >
        <Params
          params={props.config.workflowParameters.asMutable()}
          theme={props.theme}
          handleCloseParams={() => {
            setShowParamPanel(false)
          }}
          handleAddParam={handleAddParameter}
          handleChangeParam={handleChangeParam}
          handleRemoveParam={handleRemoveParam}
        />
      </SidePopper>
      <SidePopper
        isOpen={showWorkflowInfo >= 0}
        position="right"
        toggle={() => {
          setShowWorkflowInfo(-1)
        }}
        trigger={sidePanelRef.current}
      >
        <WorkflowInfoPanel
          workflow={props.config.allowedWorkflows?.asMutable()[showWorkflowInfo]}
          theme={props.theme}
          handleClosePanel={() => {
            setShowWorkflowInfo(-1)
          }}
        />
      </SidePopper>
    </div>
  )
}

export default Setting
