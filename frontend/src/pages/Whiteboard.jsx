import React from 'react';
import PageLayoutWrapper from "../components/ui/PageLayoutWrapper";
import CustomCard from "../components/ui/CustomCard";
import CustomButton from "../components/ui/CustomButton";
import { PenTool, Eraser, Square, Circle, Type, Undo, Redo, Save, Share } from "lucide-react";

export default function Whiteboard() {
  return (
    <PageLayout
      title="Whiteboard"
      subtitle="Collaborate and brainstorm with your team"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tools Panel */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Drawing Tools
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" size="sm" className="justify-start">
                <PenTool className="w-4 h-4 mr-2" />
                Pen
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Eraser className="w-4 h-4 mr-2" />
                Eraser
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Square className="w-4 h-4 mr-2" />
                Rectangle
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Circle className="w-4 h-4 mr-2" />
                Circle
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Type className="w-4 h-4 mr-2" />
                Text
              </Button>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
                Actions
              </h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Whiteboard Canvas */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] p-0 overflow-hidden">
            <div className="h-full bg-white border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <PenTool className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Interactive Whiteboard</p>
                <p className="text-sm">
                  Collaborative drawing and brainstorming will be implemented here
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
