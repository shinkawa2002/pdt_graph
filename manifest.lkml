
project_name: "pdt_graph"

application: pdt_graph {
  label: "pdt_graph"
  url: "http://localhost:8080/bundle.js"
  # file: "bundle.js
  entitlements: {
    core_api_methods: ["all_lookml_models","graph_derived_tables_for_model"] #Add more entitlements here as you develop new functionality
  }
}
