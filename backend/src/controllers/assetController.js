const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');

// Helper to auto-generate asset ID (e.g. AST-1001)
const generateAssetId = async () => {
  const count = await prisma.asset.count();
  const number = 1001 + count;
  return `AST-${number}`;
};

// Create new asset (Admin / Super Admin)
const createAsset = async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseDate,
      warrantyExpiry,
      cost,
      vendor,
      location,
      billPhoto,
      status,
      description
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Asset name and category are required.' });
    }

    if (serialNumber) {
      const existingSn = await prisma.asset.findUnique({ where: { serialNumber } });
      if (existingSn) {
        return res.status(400).json({ message: 'An asset with this serial number already exists.' });
      }
    }

    const assetId = await generateAssetId();

    const newAsset = await prisma.asset.create({
      data: {
        assetId,
        name,
        category: category || 'LAPTOP',
        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        cost: cost ? parseFloat(cost) : null,
        vendor: vendor || null,
        location: location || null,
        billPhoto: billPhoto || (req.file ? `/uploads/attachments/${req.file.filename}` : null),
        status: status || 'AVAILABLE',
        description: description || null
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'ASSET_CREATED',
      details: `Created new asset "${newAsset.name}" (${assetId})`
    });

    res.status(201).json(newAsset);
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ message: 'Failed to create asset.' });
  }
};

// Get all assets with filter, search & role checks
const getAllAssets = async (req, res) => {
  try {
    const { category, status, department, brand, search, page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Role-based visibility: Employee/Intern only view assets assigned to them
    if (req.user.role === 'INTERN' || req.user.role === 'EMPLOYEE') {
      where.assignedToId = req.user.id;
    } else {
      // Admin filters
      if (category) where.category = category;
      if (status) where.status = status;
      if (brand) where.brand = { contains: brand };
      if (department) {
        where.assignedTo = {
          department: { contains: department }
        };
      }
    }

    if (search) {
      where.OR = [
        { assetId: { contains: search } },
        { name: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { serialNumber: { contains: search } },
        { assignedTo: { name: { contains: search } } }
      ];
    }

    const [assets, totalCount] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              employeeId: true,
              name: true,
              email: true,
              role: true,
              department: true,
              profilePic: true
            }
          }
        }
      }),
      prisma.asset.count({ where })
    ]);

    res.json({
      assets,
      meta: {
        totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all assets error:', error);
    res.status(500).json({ message: 'Failed to fetch assets.' });
  }
};

// Get single asset details by ID
const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            role: true,
            department: true,
            profilePic: true
          }
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, employeeId: true, role: true } },
            assignedBy: { select: { id: true, name: true } }
          }
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            createdAt: true
          }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    // Role check: non-admins can only view their own assigned asset
    if ((req.user.role === 'INTERN' || req.user.role === 'EMPLOYEE') && asset.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Get asset by id error:', error);
    res.status(500).json({ message: 'Failed to fetch asset details.' });
  }
};

// Update asset details
const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseDate,
      warrantyExpiry,
      cost,
      vendor,
      location,
      billPhoto,
      status,
      description
    } = req.body;

    const existingAsset = await prisma.asset.findUnique({ where: { id } });
    if (!existingAsset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    if (serialNumber && serialNumber !== existingAsset.serialNumber) {
      const existingSn = await prisma.asset.findUnique({ where: { serialNumber } });
      if (existingSn) {
        return res.status(400).json({ message: 'An asset with this serial number already exists.' });
      }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name: name || existingAsset.name,
        category: category || existingAsset.category,
        brand: brand !== undefined ? brand : existingAsset.brand,
        model: model !== undefined ? model : existingAsset.model,
        serialNumber: serialNumber !== undefined ? serialNumber : existingAsset.serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : existingAsset.purchaseDate,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : existingAsset.warrantyExpiry,
        cost: cost !== undefined ? (cost ? parseFloat(cost) : null) : existingAsset.cost,
        vendor: vendor !== undefined ? vendor : existingAsset.vendor,
        location: location !== undefined ? location : existingAsset.location,
        billPhoto: billPhoto !== undefined ? billPhoto : (req.file ? `/uploads/attachments/${req.file.filename}` : existingAsset.billPhoto),
        status: status || existingAsset.status,
        description: description !== undefined ? description : existingAsset.description
      },
      include: {
        assignedTo: true
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'ASSET_UPDATED',
      details: `Updated asset "${updatedAsset.name}" (${updatedAsset.assetId})`
    });

    res.json(updatedAsset);
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ message: 'Failed to update asset.' });
  }
};

// Assign asset to a user (Intern, Employee, Admin, Team Leader)
const assignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, expectedReturn, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Assigned user is required.' });
    }

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(400).json({ message: 'Target user not found.' });
    }

    const assignedDate = new Date();
    const expectedReturnDate = expectedReturn ? new Date(expectedReturn) : null;

    // Transaction: update asset status & create assignment record
    const [updatedAsset, newAssignment] = await prisma.$transaction([
      prisma.asset.update({
        where: { id },
        data: {
          status: 'ASSIGNED',
          assignedToId: userId,
          assignedDate,
          expectedReturn: expectedReturnDate,
          notes: notes || null
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, employeeId: true, role: true, department: true }
          }
        }
      }),
      prisma.assetAssignment.create({
        data: {
          assetId: id,
          userId,
          assignedById: req.user.id,
          assignedDate,
          expectedReturn: expectedReturnDate,
          notes: notes || null,
          status: 'ACTIVE'
        }
      })
    ]);

    await logActivity({
      userId: req.user.id,
      action: 'ASSET_ASSIGNED',
      details: `Assigned asset "${asset.name}" (${asset.assetId}) to ${targetUser.name} (${targetUser.employeeId})`
    });

    res.json(updatedAsset);
  } catch (error) {
    console.error('Assign asset error:', error);
    res.status(500).json({ message: 'Failed to assign asset.' });
  }
};

// Return asset
const returnAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnDate, conditionOnReturn, remarks } = req.body;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignedTo: true }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    const prevUser = asset.assignedTo;
    const returnTime = returnDate ? new Date(returnDate) : new Date();

    // Map return condition to asset status
    let nextStatus = 'AVAILABLE';
    if (conditionOnReturn === 'Damaged') nextStatus = 'DAMAGED';
    else if (conditionOnReturn === 'Lost') nextStatus = 'LOST';
    else if (conditionOnReturn === 'Needs Repair') nextStatus = 'MAINTENANCE';

    // Find active assignment and close it
    const activeAssignment = await prisma.assetAssignment.findFirst({
      where: { assetId: id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    await prisma.$transaction([
      prisma.asset.update({
        where: { id },
        data: {
          status: nextStatus,
          assignedToId: null,
          assignedDate: null,
          expectedReturn: null,
          notes: remarks || null
        }
      }),
      ...(activeAssignment
        ? [
            prisma.assetAssignment.update({
              where: { id: activeAssignment.id },
              data: {
                returnDate: returnTime,
                conditionOnReturn: conditionOnReturn || 'Good',
                remarks: remarks || null,
                status: 'RETURNED'
              }
            })
          ]
        : [])
    ]);

    await logActivity({
      userId: req.user.id,
      action: 'ASSET_RETURNED',
      details: `Returned asset "${asset.name}" (${asset.assetId}) from ${prevUser ? prevUser.name : 'User'}. Condition: ${conditionOnReturn || 'Good'}`
    });

    res.json({ message: 'Asset returned successfully.', status: nextStatus });
  } catch (error) {
    console.error('Return asset error:', error);
    res.status(500).json({ message: 'Failed to return asset.' });
  }
};

// Delete asset (only if not currently assigned)
const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    if (asset.assignedToId || asset.status === 'ASSIGNED') {
      return res.status(400).json({
        message: 'Cannot delete asset while it is currently assigned to a user. Please return the asset first.'
      });
    }

    await prisma.asset.delete({ where: { id } });

    await logActivity({
      userId: req.user.id,
      action: 'ASSET_DELETED',
      details: `Deleted asset "${asset.name}" (${asset.assetId})`
    });

    res.json({ message: 'Asset deleted successfully.' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ message: 'Failed to delete asset.' });
  }
};

// Get asset KPI statistics for dashboard
const getAssetAnalytics = async (req, res) => {
  try {
    const [totalAssets, availableAssets, assignedAssets, maintenanceAssets, damagedAssets] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'ASSIGNED' } }),
      prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
      prisma.asset.count({ where: { status: 'DAMAGED' } })
    ]);

    res.json({
      totalAssets,
      availableAssets,
      assignedAssets,
      maintenanceAssets,
      damagedAssets
    });
  } catch (error) {
    console.error('Get asset analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch asset analytics.' });
  }
};

// Upload bill photo for an existing asset
const uploadBillPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const billPhotoPath = `/uploads/attachments/${req.file.filename}`;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: { billPhoto: billPhotoPath }
    });

    await logActivity({
      userId: req.user.id,
      action: 'ASSET_BILL_UPLOADED',
      details: `Uploaded bill photocopy for asset "${updatedAsset.name}" (${updatedAsset.assetId})`
    });

    res.json({ message: 'Bill photocopy uploaded successfully.', billPhoto: billPhotoPath, asset: updatedAsset });
  } catch (error) {
    console.error('Upload bill photo error:', error);
    res.status(500).json({ message: 'Failed to upload bill photo.' });
  }
};

// Delete/Remove bill photo for an existing asset
const deleteBillPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: { billPhoto: null }
    });

    await logActivity({
      userId: req.user.id,
      action: 'ASSET_BILL_DELETED',
      details: `Removed bill photocopy from asset "${updatedAsset.name}" (${updatedAsset.assetId})`
    });

    res.json({ message: 'Bill photocopy deleted successfully.', asset: updatedAsset });
  } catch (error) {
    console.error('Delete bill photo error:', error);
    res.status(500).json({ message: 'Failed to delete bill photo.' });
  }
};

module.exports = {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  assignAsset,
  returnAsset,
  deleteAsset,
  getAssetAnalytics,
  uploadBillPhoto,
  deleteBillPhoto
};
