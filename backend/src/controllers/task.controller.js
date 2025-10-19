import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Create task
export const createTask = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;
  
  const {
    title,
    description,
    assignedTo,
    priority = "medium",
    type = "feature",
    estimatedHours,
    dueDate,
    tags = []
  } = req.body;

  if (!title) {
    throw new ApiError(400, "Task title is required");
  }

  // Check if project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is part of project team
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this project");
  }

  // Check if assigned user is part of project team
  if (assignedTo) {
    const assignedMember = project.team.find(member => 
      member.user.toString() === assignedTo && member.status === "active"
    );

    if (!assignedMember) {
      throw new ApiError(400, "Assigned user must be a member of the project");
    }
  }

  // Create task
  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo: assignedTo || userId,
    createdBy: userId,
    priority,
    type,
    estimatedHours,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    tags
  });

  await task.populate([
    { path: "assignedTo", select: "name email avatar" },
    { path: "createdBy", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(201).json(
    new ApiResponse(201, "Task created successfully", { task })
  );
});

// Get project tasks (Kanban board)
export const getProjectTasks = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Check if project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this project");
  }

  const { status, assignedTo, priority, type, search } = req.query;

  // Build filter
  const filter = { project: projectId };

  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("project", "name")
    .sort({ createdAt: -1 });

  // Group tasks by status for Kanban board
  const kanbanData = {
    todo: tasks.filter(task => task.status === "todo"),
    in_progress: tasks.filter(task => task.status === "in_progress"),
    review: tasks.filter(task => task.status === "review"),
    done: tasks.filter(task => task.status === "completed")
  };

  return res.status(200).json(
    new ApiResponse(200, "Tasks retrieved successfully", { 
      tasks,
      kanbanData,
      total: tasks.length
    })
  );
});

// Get single task
export const getTask = asyncHandle(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findById(taskId)
    .populate("assignedTo", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("project", "name")
    .populate("comments.user", "name email avatar");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Check if user has access to this task's project
  const project = await Project.findById(task.project);
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this task");
  }

  return res.status(200).json(
    new ApiResponse(200, "Task retrieved successfully", { task })
  );
});

// Update task
export const updateTask = asyncHandle(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Check if user has access to this task's project
  const project = await Project.findById(task.project);
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this task");
  }

  const {
    title,
    description,
    assignedTo,
    priority,
    type,
    estimatedHours,
    dueDate,
    tags
  } = req.body;

  const updateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (assignedTo) updateData.assignedTo = assignedTo;
  if (priority) updateData.priority = priority;
  if (type) updateData.type = type;
  if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
  if (dueDate) updateData.dueDate = new Date(dueDate);
  if (tags) updateData.tags = tags;

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: "assignedTo", select: "name email avatar" },
    { path: "createdBy", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Task updated successfully", { task: updatedTask })
  );
});

// Move task (Kanban drag & drop)
export const moveTask = asyncHandle(async (req, res) => {
  const { taskId } = req.params;
  const { status, position } = req.body;
  const userId = req.user._id;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Check if user has access to this task's project
  const project = await Project.findById(task.project);
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this task");
  }

  // Validate status
  const validStatuses = ["todo", "in_progress", "review", "completed"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  // Update task status
  const oldStatus = task.status;
  task.status = status;
  
  // Set completion date if moving to completed
  if (status === "completed" && oldStatus !== "completed") {
    task.completedAt = new Date();
  } else if (status !== "completed" && oldStatus === "completed") {
    task.completedAt = undefined;
  }

  await task.save();

  // Add comment about status change
  task.addComment(userId, `Status changed from ${oldStatus} to ${status}`);
  await task.save();

  await task.populate([
    { path: "assignedTo", select: "name email avatar" },
    { path: "createdBy", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Task moved successfully", { task })
  );
});

// Delete task
export const deleteTask = asyncHandle(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Check if user has access to this task's project
  const project = await Project.findById(task.project);
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this task");
  }

  // Check if user can delete task (only owner, hr, mr can delete)
  if (!["owner", "hr", "mr"].includes(teamMember.role)) {
    throw new ApiError(403, "You don't have permission to delete this task");
  }

  await Task.findByIdAndDelete(taskId);

  return res.status(200).json(
    new ApiResponse(200, "Task deleted successfully")
  );
});

// Add task comment
export const addTaskComment = asyncHandle(async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Comment content is required");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Check if user has access to this task's project
  const project = await Project.findById(task.project);
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this task");
  }

  // Add comment
  const comment = task.addComment(userId, content.trim());
  await task.save();

  await task.populate([
    { path: "assignedTo", select: "name email avatar" },
    { path: "createdBy", select: "name email avatar" },
    { path: "project", select: "name" },
    { path: "comments.user", select: "name email avatar" }
  ]);

  return res.status(201).json(
    new ApiResponse(201, "Comment added successfully", { 
      task,
      comment: task.comments[task.comments.length - 1]
    })
  );
});

// Log time on task
export const logTaskTime = asyncHandle(async (req, res) => {
  const { taskId } = req.params;
  const { hours, description } = req.body;
  const userId = req.user._id;

  if (!hours || hours <= 0) {
    throw new ApiError(400, "Valid hours are required");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Check if user has access to this task's project
  const project = await Project.findById(task.project);
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this task");
  }

  // Log time
  const timeLog = task.logTime(userId, hours, description || "");
  await task.save();

  await task.populate([
    { path: "assignedTo", select: "name email avatar" },
    { path: "createdBy", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(201).json(
    new ApiResponse(201, "Time logged successfully", { 
      task,
      timeLog: task.timeLogs[task.timeLogs.length - 1]
    })
  );
});

// Get task statistics
export const getTaskStats = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Check if project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this project");
  }

  const stats = await Task.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalHours: { $sum: "$actualHours" }
      }
    }
  ]);

  const totalTasks = await Task.countDocuments({ project: projectId });
  const completedTasks = await Task.countDocuments({ 
    project: projectId, 
    status: "completed" 
  });
  const overdueTasks = await Task.countDocuments({
    project: projectId,
    dueDate: { $lt: new Date() },
    status: { $ne: "completed" }
  });

  const statsObject = {
    total: totalTasks,
    completed: completedTasks,
    overdue: overdueTasks,
    byStatus: {
      todo: 0,
      in_progress: 0,
      review: 0,
      completed: 0
    },
    totalHours: 0
  };

  stats.forEach(stat => {
    statsObject.byStatus[stat._id] = stat.count;
    statsObject.totalHours += stat.totalHours || 0;
  });

  return res.status(200).json(
    new ApiResponse(200, "Task statistics retrieved successfully", { stats: statsObject })
  );
});

// Get all Kanban boards for user (tasks organized by project)
export const getAllKanbanBoards = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { 
    page = 1, 
    limit = 10, 
    search, 
    sortBy = 'updatedAt', 
    sortOrder = 'desc',
    status,
    priority
  } = req.query;

  try {
    // First, get all projects the user has access to
    const userProjects = await Project.find({
      $or: [
        { "team.user": userId, "team.status": "active" },
        { projectManager: userId }
      ],
      isActive: true
    }).select('_id name description');

    const projectIds = userProjects.map(project => project._id);

    if (projectIds.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, "No projects found", { 
          kanbanBoards: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        })
      );
    }

    // Build filter for tasks
    const filter = { 
      project: { $in: projectIds }
    };

    // Add additional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
          ]
        }
      ];
    }
    
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate({
        path: "project",
        select: "name description",
        options: { lean: true }
      })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .lean();

    // Group tasks by project to create Kanban boards
    const kanbanBoards = userProjects.map(project => {
      const projectTasks = tasks.filter(task => 
        task.project && task.project._id.toString() === project._id.toString()
      );

      // Group tasks by status for Kanban columns
      const columns = {
        todo: projectTasks.filter(task => task.status === 'todo'),
        in_progress: projectTasks.filter(task => task.status === 'in_progress'),
        review: projectTasks.filter(task => task.status === 'review'),
        completed: projectTasks.filter(task => task.status === 'completed')
      };

      // Calculate project stats
      const totalTasks = projectTasks.length;
      const completedTasks = columns.completed.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        _id: project._id,
        name: project.name,
        description: project.description,
        columns,
        stats: {
          totalTasks,
          completedTasks,
          progress,
          overdue: projectTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
          ).length
        },
        updatedAt: projectTasks.length > 0 ? 
          Math.max(...projectTasks.map(task => new Date(task.updatedAt).getTime())) : 
          new Date().getTime()
      };
    });

    // Sort Kanban boards
    kanbanBoards.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'totalTasks':
          aValue = a.stats.totalTasks;
          bValue = b.stats.totalTasks;
          break;
        case 'progress':
          aValue = a.stats.progress;
          bValue = b.stats.progress;
          break;
        default: // updatedAt
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBoards = kanbanBoards.slice(skip, skip + parseInt(limit));
    const totalCount = kanbanBoards.length;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return res.status(200).json(
      new ApiResponse(200, "Kanban boards retrieved successfully", { 
        kanbanBoards: paginatedBoards,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (error) {
    throw error;
  }
});