import React from 'react';

const Stub: React.FC<{ name: string; props: any }> = ({ name, props }) => (
    <div className="p-6 m-4 border border-dashed border-gray-400 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">{name}</h2>
        <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
            {JSON.stringify(props, null, 2).substring(0, 500)}
            {JSON.stringify(props, null, 2).length > 500 && '...'}
        </pre>
    </div>
);

export const ComparisonPage: React.FC<any> = (props) => <Stub name="ComparisonPage" props={props} />;
export const ComparisonBar: React.FC<any> = (props) => <Stub name="ComparisonBar" props={props} />;
export const InfoPage: React.FC<any> = (props) => <Stub name="InfoPage" props={props} />;
export const StoryViewer: React.FC<any> = (props) => <Stub name="StoryViewer" props={props} />;
export const StoresMapPage: React.FC<any> = (props) => <Stub name="StoresMapPage" props={props} />