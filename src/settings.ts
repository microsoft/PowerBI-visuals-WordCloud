/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    // TODO: rewrite this class
    export class WordCloudSettings {
        public static get Default() {
            return new this();
        }

        public static parse(dataView: DataView) {
            var settings = new this();
            return settings;
        }

        //Default Settings
        public general = {
            maxNumberOfWords: 200,
            minFontSize: 20 / WordCloud.FontSizePercentageCoefficent,
            maxFontSize: 100 / WordCloud.FontSizePercentageCoefficent,
            isBrokenText: true
        };
        public stopWords = {
            show: true,
            isDefaultStopWords: false,
            words: null
        };
        public rotateText = {
            show: true,
            minAngle: -60,
            maxAngle: 90,
            maxNumberOfOrientations: 2
        };
    }
}