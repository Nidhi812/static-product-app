/**
 * PRODUCTS APPLICATION - MODULE FEDERATION REMOTE CONFIGURATION
 * 
 * This microfrontend is responsible for:
 * • Displaying product catalog with images and details
 * • Product search and filtering functionality  
 * • Adding products to cart via shared CartService
 * • Product detail views and specifications
 * 
 * Module Federation Setup:
 * • Acts as a REMOTE application (not host)
 * • Exposes main component for consumption by shell-app
 * • Shares Angular dependencies to avoid duplication
 * • Runs on port 4201 (configured in package.json)
 */

const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  // REMOTE APPLICATION NAME
  // This identifies this app in the Module Federation network
  name: 'products-app',
  
  // EXPOSED MODULES
  // These components/modules are available for other apps to consume
  exposes: {
    // Main app component that will be loaded by shell-app
    './Component': './src/app/app.ts',
  },

  // SHARED DEPENDENCIES
  // These libraries are shared with the host and other remotes
  // singleton: ensures only one instance exists across all apps
  // strictVersion: enforces version compatibility checks
  shared: {
    ...shareAll({ 
      singleton: true, 
      strictVersion: true, 
      requiredVersion: 'auto' 
    }),
  },

});
