
project_name: "pdt_graph"

application: pdt_graph {
  label: "pdt_graph"
  url: "http://localhost:8080/bundle.js"
  # file: "bundle.js
  entitlements: {
    core_api_methods: ["me"] #Add more entitlements here as you develop new functionality
  }
}
