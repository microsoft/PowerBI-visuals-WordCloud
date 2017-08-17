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