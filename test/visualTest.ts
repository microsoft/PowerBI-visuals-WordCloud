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
    import renderTimeout = powerbi.extensibility.utils.test.helpers.renderTimeout;
    import MockISelectionManager = powerbi.extensibility.utils.test.mocks.MockISelectionManager;

    // powerbi.extensibility.visual.test
    import WordCloudData = powerbi.extensibility.visual.test.WordCloudData;
    import WordCloudBuilder = powerbi.extensibility.visual.test.WordCloudBuilder;
    import areColorsEqual = powerbi.extensibility.visual.test.helpers.areColorsEqual;
    import getRandomUniqueHexColors = powerbi.extensibility.visual.test.helpers.getRandomUniqueHexColors;
    import getSolidColorStructuralObject = powerbi.extensibility.visual.test.helpers.getSolidColorStructuralObject;

    // WordCloud1447959067750
    import VisualClass = powerbi.extensibility.visual.WordCloud1447959067750.WordCloud;

    /**
     * Extends the mock of ISelectionManager.
     * sendSelectionToHost is private method of ISelectionIdManager, so we don't have to add it to the test utils package.
     * Let's consider this ability if we have any other visuals with the same issue.
     */
    MockISelectionManager.prototype["sendSelectionToHost"] = function (selectionIds: ISelectionId[]) {
        this.select(selectionIds);
    };

    describe("WordCloud", () => {
        let visualBuilder: WordCloudBuilder,
            defaultDataViewBuilder: WordCloudData,
            dataView: DataView;

        beforeEach(() => {
            visualBuilder = new WordCloudBuilder(1000, 500);
            defaultDataViewBuilder = new WordCloudData();

            dataView = defaultDataViewBuilder.getDataView();
        });

        // function that uses grep to filter DOM elements
        function grep(elements: HTMLElement[], text: string = "Afghanistan"): Element[] {
            return $.grep(elements, (element: Element) => {
                return element.innerHTML === "" || element.textContent === text;
            });
        };

        describe("DOM tests", () => {
            it("svg element created", () => {
                expect(visualBuilder.mainElement[0]).toBeInDOM();
            });

            it("basic update", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.wordText.length)
                        .toBeGreaterThan(0);
                    done();
                });
            });

            it("Word returns after word stop property is changed back", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(grep(visualBuilder.wordText.toArray()).length)
                        .toBeGreaterThan(0);

                    dataView.metadata.objects = {
                        stopWords: {
                            show: true,
                            words: "Afghanistan"
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        expect(grep(visualBuilder.wordText.toArray()).length)
                            .toBe(0);

                        (dataView.metadata.objects as any).stopWords.show = false;

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            expect(grep(visualBuilder.wordText.toArray()).length)
                                .toBeGreaterThan(0);

                            done();
                        });
                    }, 500);
                }, 300);
            });

            it("click on first visual, then click on the second visual doesn't remove items", (done) => {
                const secondVisualBuilder: WordCloudBuilder = new WordCloudBuilder(500, 1000);

                visualBuilder.update(dataView);

                secondVisualBuilder.updateRenderTimeout(dataView, () => {
                    const firstWord: JQuery = visualBuilder.wordText.first();

                    firstWord.d3Click(
                        parseInt(firstWord.attr("x"), 10),
                        parseInt(firstWord.attr("y"), 10));

                    setTimeout(() => {
                        const secondWord: JQuery = secondVisualBuilder.wordText.first();

                        secondWord.d3Click(
                            parseInt(secondWord.attr("x"), 10),
                            parseInt(secondWord.attr("y"), 10));

                        setTimeout(() => {
                            expect(secondVisualBuilder.wordText.length)
                                .toBe(visualBuilder.wordText.length);

                            done();
                        });
                    });
                }, 100);
            });

            it("click on first visual, then click on the second visual doesn't remove items", (done) => {
                defaultDataViewBuilder.valuesCategoryValues = [
                    ["car collision hallway fall crash hallway", 1],
                    ["car collision hallway hallway", 2],
                    ["car collision person person car injure", 3]
                ];

                dataView = defaultDataViewBuilder.getDataView();

                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                    const texts: string[] = visualBuilder.wordText
                        .toArray()
                        .map((element: Element) => $(element).text());

                    expect(texts.length).toEqual(_.difference(texts).length);

                    done();
                }, 100);
            });

            it("multiple selection test", (done) => {
                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                    visualBuilder.wordClick("Afghanistan");

                    renderTimeout(() => {
                        expect(visualBuilder.selectedWords.length).toBe(1);

                        visualBuilder.wordClick("Albania", true);

                        renderTimeout(() => {
                            expect(visualBuilder.selectedWords.length).toBe(2);

                            done();
                        });
                    });
                }, 300);
            });

            it("max number of words test", (done) => {
                const maxNumberOfWords: number = 30;

                defaultDataViewBuilder.valuesCategoryValues.forEach((value: any[], index: number) => {
                    value[1] = 1000 + index;
                });

                dataView = defaultDataViewBuilder.getDataView();

                dataView.metadata.objects = {
                    general: {
                        maxNumberOfWords,
                        isBrokenText: false
                    }
                };

                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                    expect(visualBuilder.wordText.length).toEqual(maxNumberOfWords);

                    done();
                }, 300);
            });

            it("null word values test", () => {
                dataView.categorical.categories[0].values = dataView.categorical
                    .categories[0]
                    .values
                    .map((value: PrimitiveValue, index: number) => {
                        return index % 2 === 0
                            ? null
                            : value;
                    });

                expect(() => visualBuilder.update(dataView)).not.toThrowError();
            });
        });

        describe("Format settings test", () => {
            describe("Data color", () => {
                it("colors", (done) => {
                    let category: DataViewCategoryColumn,
                        colors: string[];

                    defaultDataViewBuilder
                        .valuesCategoryValues
                        .splice(0, defaultDataViewBuilder.valuesCategoryValues.length - 10);

                    dataView = defaultDataViewBuilder.getDataView();

                    category = dataView.categorical.categories[0];

                    colors = getRandomUniqueHexColors(category.values.length);

                    category.objects = category.objects || [];

                    category.values.forEach((value: PrimitiveValue, index: number) =>
                        category.objects[index] = {
                            dataPoint: {
                                fill: getSolidColorStructuralObject(colors[index])
                            }
                        });

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        visualBuilder.wordText
                            .toArray()
                            .forEach((element: Element) => {
                                const fillColor: string = $(element).css("fill");

                                expect(colors.some((color: string) => {
                                    return areColorsEqual(fillColor, color);
                                }));
                            });

                        done();
                    }, 1000);
                });
            });

            describe("Stop words", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        stopWords: {
                            show: true
                        }
                    };
                });

                it("show", done => {
                    (dataView.metadata.objects as any).stopWords.words = "Afghanistan";

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        expect(grep(visualBuilder.wordText.toArray()).length).toBe(0);

                        (dataView.metadata.objects as any).stopWords.show = false;

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            expect(grep(visualBuilder.wordText.toArray()).length).toBeGreaterThan(0);

                            done();
                        }, 500);
                    }, 500);
                });

                it("words", done => {
                    (dataView.metadata.objects as any).stopWords.words = "";

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        expect(grep(visualBuilder.wordText.toArray()).length)
                            .toBeGreaterThan(0);

                        (dataView.metadata.objects as any).stopWords.words = "Afghanistan";

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            expect(grep(visualBuilder.wordText.toArray()).length)
                                .toBe(0);
                            done();
                        }, 500);
                    }, 500);
                });
            });

            describe("Rotate text", () => {
                it("min/max angle", done => {
                    const minAngle: number = -50,
                        maxAngle: number = 50;

                    dataView.metadata.objects = {
                        rotateText: {
                            minAngle,
                            maxAngle
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        visualBuilder.words
                            .toArray()
                            .forEach((element: Element) => {
                                const rotate: number = d3.transform($(element).attr("translate")).rotate;

                                expect(rotate).toBeGreaterThan(minAngle);
                                expect(rotate).toBeLessThan(maxAngle);
                            });

                        done();
                    }, 500);
                });
            });
        });

        describe("getCanvasContext", () => {
            let visualInstance: VisualClass;

            beforeEach(() => {
                visualInstance = visualBuilder.instance;
            });

            it("shouldn't throw any unexpected exceptions if canvas is undefined", () => {
                visualInstance.canvas = null;

                expect(() => {
                    visualInstance.getCanvasContext();
                }).not.toThrow();
            });

            it("should return null if canvas is undefined", () => {
                visualInstance.canvas = null;

                expect(visualInstance.getCanvasContext()).toBeNull();
            });

            it("should return defined value", () => {
                let context: CanvasRenderingContext2D = visualInstance.getCanvasContext();

                expect(context).not.toBeUndefined();
                expect(context).not.toBeNull();
            });
        });
    });
}
