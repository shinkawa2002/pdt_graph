// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useEffect, useState, useContext, useCallback } from 'react'
import { Space, ComponentsProvider, Span, FieldSelect, MessageBar, SpaceVertical, Spinner, ProgressCircular } from '@looker/components'
import { ExtensionContext } from '@looker/extension-sdk-react'
import Graphviz from 'graphviz-react'

/**
 * A simple component that uses the Looker SDK through the extension sdk to display a customized hello message.
 */

export const PdtGraph = () => {
  const { core40SDK } = useContext(ExtensionContext)
  const [message, setMessage] = useState()
  const [lookmlModels, setLooklModels] = useState([])
  const [modelOptions, setModelOptions] = useState([])
  const [selectedModel, setSelectedModel] = useState()
  const [graphText, setGraphText] = useState()
  const [windowDims, setWindowDims] = useState({})
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isConnLoading, setIsConnLoading] = useState(true)
  const [isPdtLoading, setIsPdtLoading] = useState(false)
  const [pdtViews, setPdtViews] = useState([])
  const [connections, setConnections] = useState([])
  const [model, setModel] = useState()
  const [connection, setConnection] = useState()
  const [isGraphLoading, setIsGraphLoading] = useState(false)

  const getWindowDimensions = () => {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }

  // get window size
  useEffect(() => {
    const dimensions = getWindowDimensions()
    setWindowDims(dimensions)
  },[])

  // Get all LookML models
  useEffect(() => {
    const initialize = async () => {
      try {
        const result = await core40SDK.ok(core40SDK.all_connections('name'))
        const models = []
        const cons = []
        if (result) {
          const cons = result.map((rec) => {
            return rec['name']
          })

          setConnections(cons)
          setIsConnLoading(false)
        }
      } catch (error) {
        setMessage('Error occured getting connections')
        console.error(error)
      }

      try {
        const models = await core40SDK.ok(core40SDK.all_lookml_models('label,name,project_name,allowed_db_connection_names'))
        setLooklModels(models)
        updateModelOptions()
        setIsModelLoading(false)
      } catch (error) {
        setMessage('Error occured getting model information')
        console.error(error)
      }

    }
    initialize()
  },[])

  useEffect(() => {
    const getPdts = async () => {
      setIsPdtLoading(true)
      try {
        const filterOps = {}
        if (model) {
          filterOps["pdt_builds.model_name"] = model
        }
        if (connection) {
          filterOps["pdt_builds.connection"] = connection
        }
        const result = await core40SDK.ok(core40SDK.run_inline_query(
          {
            result_format: 'json',
            body: {
              model: 'system__activity',
              view: 'pdt_builds',
              fields: [
                'pdt_builds.connection',
                'pdt_builds.model_name',
                'pdt_builds.view_name'
              ],
              filters: filterOps,
              total: false,
              runtime: 0
            },
            limit: 500
          }))
        if (result) {
          const pdtData = result.map((record) => {
            return {
              connection: record['pdt_builds.connection'],
              model: record['pdt_builds.model_name'],
              view: record['pdt_builds.view_name']
            }
          })
          setPdtViews(pdtData)
        } else {
          setPdtViews([])
        }

      } catch (error) {
        setMessage('Error occured getting PDTs')
        console.error(error)
      }
      setIsPdtLoading(false)
    }
    
    if (!model || !connection) {
      return
    } else {
      getPdts()
    }
  },[model,connection])

  const getPdtGraph = useCallback(async (selectPdt, model) => {
    setIsGraphLoading(true)
    try {
      const result = await core40SDK.ok(core40SDK.graph_derived_tables_for_view({
        view: selectPdt,
        models: model
      }))
      if (result) {
        setGraphText(result.graph_text)
      } else {
        setGraphText("")
      }
    } catch (error) {
      setMessage("Error occured getting pdt graph")
      console.error(error)
    }
    setIsGraphLoading(false)
  },[])

  // create model option list
  const updateModelOptions = (con) => {
    const options = []
    const _con = con ? con : connection
    lookmlModels.forEach((item) => {
      if (_con && _con !== "") {
        const cons = item['allowed_db_connection_names']
        if (cons.includes(_con)) {
          options.push({
            value: item['name'],
            label: item['label']            
          })
        }
      }
    })
    setModelOptions(options)
  }
  
  const connOptions = connections.map((item) => {
    return {
      value: item,
      label: item
    }
  })

  const pdtOpsions = pdtViews.map((item) => {
    return {
      value: item.view,
      label: item.view
    }
  })

  const modelSelected = (value) => {
    setSelectedModel(value)
    setModel(value)
    // getModelGraph(value)
  }

  const conSelected = (value) => {
    setConnection(value)
    setSelectedModel("")
    updateModelOptions(value)
  }

  const pdtSelected = (value) => {
    getPdtGraph(value, model)
  }

  const graphOptions = {
    fit: true,
    height: windowDims.height * 0.8,
    width: windowDims.width
  }

  const StatusMessage = () => {
    let isLoading = false
    let desc = ""
    if (isPdtLoading || isModelLoading || isConnLoading) {
      isLoading = true
    }

    if (isConnLoading && isModelLoading) {
      desc = '初期設定中'
    } else if (isModelLoading) {
      desc = 'モデル設定中'
    } else if (isPdtLoading) {
      desc = 'PDT取得中'
    } else if (!graphText || graphText === "") {
      desc = 'PDTを選択してください'
    } else {
      desc = 'コネクション、モデル、PDTを選択してください'
    }

    return (
    <>
      {desc !== "" && (
        <Span fontSize="large">
        {desc}{isLoading && (<Spinner/>)}
        </Span>
      )}
    </>
    )
  }

  return (
    <>
      <ComponentsProvider loadGoogleFonts>
        <Space around>
          <SpaceVertical gap="u2">
            {message && (
            <MessageBar intent="critical" >{message}</MessageBar>
            )}
            <Space>
            <FieldSelect
              key="connection_selector"
              name="connection_selector"
              label="Connection"
              options={connOptions}
              isLoading={isConnLoading}
              onChange={conSelected}
              disabled={isPdtLoading}
            />
            <FieldSelect
              key="model_selector"
              name="model_selector"
              label="Model"
              options={modelOptions}
              onChange={modelSelected}
              default={selectedModel}
              isLoading={isModelLoading}
              disabled={isPdtLoading}
            />
            <FieldSelect
              key="pdt_selector"
              name="pdt_selector"
              label="PDT"
              options={pdtOpsions}
              isLoading={isPdtLoading}
              onChange={pdtSelected}
              disabled={isGraphLoading}
            />
          </Space>
          <StatusMessage/>
          {isGraphLoading && (
            <Space justifyContent="center">
              <ProgressCircular/>
            </Space>
          )}
          {!isGraphLoading && graphText && graphText !== "" && (
            <Graphviz
              dot={graphText}
              options={graphOptions}
            />
          )}
          </SpaceVertical>
        </Space>
      </ComponentsProvider>
    </>
  )
}
