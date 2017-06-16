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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.utils.test
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;
    import ClickEventType = powerbi.extensibility.utils.test.helpers.ClickEventType;

    // WordCloud1447959067750
    import VisualPlugin = powerbi.visuals.plugins.WordCloud1447959067751;
    import VisualClass = powerbi.extensibility.visual.WordCloud1447959067751.WordCloud;

    export class WordCloudBuilder extends VisualBuilderBase<VisualClass> {
        private static MaxOpacity: number = 1;

        constructor(width: number, height: number) {
            super(width, height, VisualPlugin.name);
        }

        protected build(options: VisualConstructorOptions) {
            return new VisualClass(options);
        }

        public get instance(): VisualClass {
            return this.visual;
        }

        public get mainElement() {
            return this.element.children("svg.wordCloud");
        }

        public get words() {
            return this.mainElement
                .children("g")
                .children("g.words")
                .children("g.word");
        }

        public get wordText() {
            return this.words.children("text");
        }

        public get wordRects() {
            return this.words.children("rect");
        }

        public wordClick(text: string, ctrl = false) {
            const elements: Element[] = this.words
                .toArray()
                .filter((element: HTMLElement) => {
                    return $(element).children("text").text() === text;
                });

            if (_.isEmpty(elements)) {
                return;
            }

            const element: JQuery = $(elements[0]).children("rect");

            element.d3Click(
                parseFloat(element.attr("x")),
                parseFloat(element.attr("y")),
                ctrl
                    ? ClickEventType.CtrlKey
                    : undefined);
        }

        public get selectedWords() {
            return this.wordText.filter((i: number, element: Element) => {
                return parseFloat($(element).css("fill-opacity")) === WordCloudBuilder.MaxOpacity;
            });
        }
    }
}
