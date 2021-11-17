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

import React, { useEffect, useState, useContext, useReducer } from 'react'
import { Space, ComponentsProvider, Span, FieldSelect, MessageBar, SpaceVertical } from '@looker/components'
import { ExtensionContext } from '@looker/extension-sdk-react'
import Graphviz from 'graphviz-react'

/**
 * A simple component that uses the Looker SDK through the extension sdk to display a customized hello message.
 */

export const PdtGraph = () => {
  const { core40SDK } = useContext(ExtensionContext)
  const [message, setMessage] = useState()
  const [desciption, setDescription] = useState('モデルを選択してください')
  const [lookmlModels, setLooklModels] = useState([])
  const [selectedModel, setSelectedModel] = useState()
  const [graphText, setGraphText] = useState()
  const [windowDims, setWindowDims] = useState({})
  const [isModelLoading, setIsModelLoading] = useState(true)

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
        const models = await core40SDK.ok(core40SDK.all_lookml_models('label,name,project_name'))
        setLooklModels(models)
        setIsModelLoading(false)
      } catch (error) {
        setMessage('Error occured getting model information')
        console.error(error)
      }  
    }
    initialize()
  },[])

  // get derive table graph for model
  const getModelGraph = async (model) => {
    try {
      setGraphText('')
      const result = await core40SDK.ok(core40SDK.graph_derived_tables_for_model({model: model}))
      if (result.graph_text.indexOf("subgraph") > -1) {
        setGraphText(result.graph_text)
      } else {
        setDescription('PDTが存在しません。他のモデルを選択してください。')
      }
    } catch (error) {
      setMessage('Error occured getting PDT graph')
      console.error(error)
    }
  }  

  // create model option list
  const modelOptions = lookmlModels.map(({label, name}) => {
    return {
      value: name,
      label: label
    }
  })

  const modelSelected = (value) => {
    setSelectedModel(value)
    getModelGraph(value)
  }

  const graphOptions = {
    fit: true,
    height: windowDims.height * 0.8,
    width: windowDims.width
  }

  return (
    <>
      <ComponentsProvider loadGoogleFonts>
        <Space around>
          <SpaceVertical gap="u2">
            {message && (
            <MessageBar intent="critical" >{message}</MessageBar>
            )}
            <FieldSelect
            key="model_selector"
            name="model_selector"
            label="Model"
            options={modelOptions}
            onChange={modelSelected}
            default={selectedModel}
            isLoading={isModelLoading}
          />
          {!graphText && (
            <Span fontSize="large">
            {desciption}
          </Span>
          )}
          {graphText && (
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
