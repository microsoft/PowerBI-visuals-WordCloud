## 2.3.3.0
### Visual changes:
* Fix bug with bookmarks

## 2.3.2.0
### Visual changes:
* Fix color reassignment
* Fix bug with data displaying
### Code improvements: 
* Update dependencies
* Api 5.11.0

## 2.3.1.0
* Added keyboard navigation

## 2.3.0.0
### Visual changes:
* Use selectionManager for interactive behavior
* Fix clear selection bug
* Add bookmark support
### Code improvements:
* API v5.9.0
* Update dependencies and fix audit vulnerabilities

## 2.2.0
* API v5.4.0
* Fixed bug with instantiation of the SelectingManager class
* Updated packages and got rid of vulnerabilities
* Fixed lint errors
* Migrated from enumerateObjectInstances to the new FormattingModel API
* Removed JQuery and split lodash into subpackages

## 2.0.0
* Webpack integration
* Azure Pipelines integration
* API 2.5.0
* updated powerbi-visuals-utils, powerbi-visuals-tools 3.x.x
* d3 v5

# 1.7.1
* Implements minimum repetition to appear on cloud [#35]

## 1.7.0
* High contrast mode
* API 1.13.0

## 1.6.0
* Added localization for all supported languages

## 1.5.0
* ADD. Bookmarks support

## 1.4.2
* UPD. Words positioninig is fixed for now

## 1.4.1
* Remove recursion call of function computeCycle

## 1.4.0
* Added performance tuning settings

## 1.3.2
* FIX. Applying of value format to tooltip values

## 1.3.1
* FIX. Option for showing of special characters was repaired 

## 1.3.0
* ADD. Added a new role to set excludes (like filters) for categories. This feature works in addition to StopWords options, however, if option is disabled, excludes will be applied anyway

## 1.2.14
* FIX. Fix to use Defered object without jQuery library 

## 1.2.13
* ADD. Added default color for words
* ADD. Added tooltips

## 1.2.12
* FIX. memory leak: Failed to execute 'getImageData' on 'CanvasRenderingContext2D': Out of memory at ImageData creation
* UPDATE. Updated package dependencies 

## 1.2.11
* FIX. Stop word doesn't work if Word-breaking turned off
* FIX. Visual always was removing special characters. Added "Special characters" boolean property to "General" tab which will be control removing spesial characters
