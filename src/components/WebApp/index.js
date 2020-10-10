// @flow
import React, { useState } from "react"
import { HeaderContext } from "../Header"
import StartingPage from "../StartingPage"
import DatasetEditor from "../DatasetEditor"
import ErrorToasts from "../ErrorToasts"
import useErrors from "../../hooks/use-errors.js"
import LocalStorageDatasetManager from "udt-dataset-managers/dist/LocalStorageDatasetManager.js"
import useActiveDatasetManager from "../../hooks/use-active-dataset-manager"
import AppErrorBoundary from "../AppErrorBoundary"
import useEventCallback from "use-event-callback"
import usePreventNavigation from "../../hooks/use-prevent-navigation"
import { FileContext } from "../FileContext"
import usePosthog from "../../hooks/use-posthog"
import ManagePluginsDialog from "../ManagePluginsDialog"
import usePluginProvider from "../PluginProvider"
import download from "in-browser-download"
import toUDTCSV from "../../utils/to-udt-csv"

export default () => {
  const [datasetManager, setDatasetManager] = useActiveDatasetManager()

  usePreventNavigation(Boolean(datasetManager))
  usePluginProvider()
  const posthog = usePosthog()
  const [errors] = useErrors()

  const [managePluginsDialogOpen, setManagePluginsDialogOpen] = useState(false)

  const [selectedBrush, setSelectedBrush] = useState("complete")
  const onCreateTemplate = useEventCallback(async (template) => {
    const dm = new LocalStorageDatasetManager()
    await dm.setDataset({
      ...template.dataset,
      name: `New ${template.dataset.interface.type} Dataset`,
    })
    setDatasetManager(dm)
  })

  const openRecentItem = useEventCallback((item) => {}) //setFile(item))
  const onClickHome = useEventCallback(() => {}) // setFile(null))
  const onClickManagePlugins = useEventCallback(() =>
    setManagePluginsDialogOpen(true)
  )
  const onDownload = useEventCallback(async (format) => {
    posthog.capture("download_file", { file_type: format })
    const ds = await datasetManager.getDataset()
    const userProvidedFileName = (
      datasetManager.sessionId ||
      ds.name ||
      "MyDataset"
    ).replace(/\.udt\.(csv|json)/, "")
    const outputName = userProvidedFileName + ".udt." + format
    if (format === "json") {
      download(JSON.stringify(ds), outputName)
    } else if (format === "csv") {
      download(toUDTCSV(ds), outputName)
    }
  })

  const [sessionBoxOpen, changeSessionBoxOpen] = useState(false)

  const isWelcomePage = !datasetManager

  return (
    <>
      <FileContext.Provider value={{} /*{ file, setFile }*/}>
        <HeaderContext.Provider
          value={{
            recentItems: [],
            changeRecentItems: () => {},
            onClickTemplate: onCreateTemplate,
            onClickHome,
            onClickManagePlugins,
            // onOpenFile: openFile,
            onOpenRecentItem: openRecentItem,
            sessionBoxOpen,
            changeSessionBoxOpen,
            // onCreateSession: makeSession,
            fileOpen: Boolean(datasetManager),
            onDownload,
            onChangeSelectedBrush: setSelectedBrush,
            selectedBrush,
            isWelcomePage,
          }}
        >
          <div>
            {isWelcomePage ? (
              <StartingPage
                // onFileDrop={openFile}
                onOpenTemplate={onCreateTemplate}
                recentItems={[]}
                onOpenRecentItem={openRecentItem}
                onClickOpenSession={() => changeSessionBoxOpen(true)}
              />
            ) : (
              <AppErrorBoundary>
                <DatasetEditor
                  selectedBrush={selectedBrush}
                  recentItems={[] /* recentItems */}
                />
              </AppErrorBoundary>
            )}
            <ManagePluginsDialog
              open={managePluginsDialogOpen}
              onClose={() => setManagePluginsDialogOpen(false)}
            />
          </div>
        </HeaderContext.Provider>
      </FileContext.Provider>
      <ErrorToasts errors={errors} />
    </>
  )
}
