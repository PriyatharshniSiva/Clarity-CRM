const prisma = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');

// Default System Fields per Entity Type
const SYSTEM_DEFAULT_FIELDS = {
  USER_PROFILE: [
    { fieldKey: 'name', label: 'Full Name', placeholder: 'John Doe', fieldType: 'TEXT', isSystemDefault: true, order: 1, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] },
    { fieldKey: 'email', label: 'Email Address', placeholder: 'john@example.com', fieldType: 'EMAIL', isSystemDefault: true, order: 2, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: ['ALL'] },
    { fieldKey: 'phone', label: 'Phone Number', placeholder: '+1 234 567 890', fieldType: 'PHONE', isSystemDefault: true, order: 3, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: [] },
    { fieldKey: 'department', label: 'Department', placeholder: 'Engineering', fieldType: 'TEXT', isSystemDefault: true, order: 4, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: [] },
    { fieldKey: 'designation', label: 'Designation', placeholder: 'Software Engineer', fieldType: 'TEXT', isSystemDefault: true, order: 5, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: [] }
  ],
  INTERN_PROFILE: [
    { fieldKey: 'name', label: 'Full Name', placeholder: 'Jane Intern', fieldType: 'TEXT', isSystemDefault: true, order: 1, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] },
    { fieldKey: 'email', label: 'Email Address', placeholder: 'intern@example.com', fieldType: 'EMAIL', isSystemDefault: true, order: 2, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: ['ALL'] },
    { fieldKey: 'college', label: 'College / University', placeholder: 'MIT', fieldType: 'TEXT', isSystemDefault: true, order: 3, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['INTERN'] },
    { fieldKey: 'internshipRole', label: 'Internship Domain / Role', placeholder: 'Frontend Developer', fieldType: 'TEXT', isSystemDefault: true, order: 4, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: [] },
    { fieldKey: 'internshipDuration', label: 'Internship Duration', placeholder: '3 Months', fieldType: 'TEXT', isSystemDefault: true, order: 5, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: [] }
  ],
  EMPLOYEE_PROFILE: [
    { fieldKey: 'name', label: 'Full Name', placeholder: 'Alex Smith', fieldType: 'TEXT', isSystemDefault: true, order: 1, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] },
    { fieldKey: 'email', label: 'Work Email', placeholder: 'alex@company.com', fieldType: 'EMAIL', isSystemDefault: true, order: 2, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: ['ALL'] },
    { fieldKey: 'department', label: 'Department', placeholder: 'Product Design', fieldType: 'TEXT', isSystemDefault: true, order: 3, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: ['EMPLOYEE'] },
    { fieldKey: 'joiningDate', label: 'Joining Date', placeholder: '', fieldType: 'DATE', isSystemDefault: true, order: 4, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: [] }
  ],
  PROJECT: [
    { fieldKey: 'name', label: 'Project Name', placeholder: 'CRM Redesign', fieldType: 'TEXT', isSystemDefault: true, order: 1, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] },
    { fieldKey: 'projectCode', label: 'Project Code', placeholder: 'PRJ-1001', fieldType: 'TEXT', isSystemDefault: true, order: 2, visibleTo: ['ALL'], editableBy: ['ADMIN', 'SUPER_ADMIN'], requiredFor: ['ALL'] },
    { fieldKey: 'type', label: 'Project Type', placeholder: 'CLIENT', fieldType: 'DROPDOWN', options: ['CLIENT', 'INTERNAL', 'MAINTENANCE', 'RND', 'TRAINING'], isSystemDefault: true, order: 3, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] },
    { fieldKey: 'status', label: 'Project Status', placeholder: 'ACTIVE', fieldType: 'DROPDOWN', options: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], isSystemDefault: true, order: 4, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] }
  ],
  TASK: [
    { fieldKey: 'title', label: 'Task Title', placeholder: 'Build Dashboard Layout', fieldType: 'TEXT', isSystemDefault: true, order: 1, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] },
    { fieldKey: 'description', label: 'Description', placeholder: 'Provide task details...', fieldType: 'TEXTAREA', isSystemDefault: true, order: 2, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] },
    { fieldKey: 'priority', label: 'Priority', placeholder: 'MEDIUM', fieldType: 'DROPDOWN', options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], isSystemDefault: true, order: 3, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: [] },
    { fieldKey: 'deadline', label: 'Due Date', placeholder: '', fieldType: 'DATETIME', isSystemDefault: true, order: 4, visibleTo: ['ALL'], editableBy: ['ALL'], requiredFor: ['ALL'] }
  ]
};

// Default Menu Items per Role
const DEFAULT_ROLE_MENUS = {
  SUPER_ADMIN: [
    { menuKey: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/', order: 1, isVisible: true },
    { menuKey: 'super_admin', label: 'Platform Control Center', icon: 'ShieldAlert', route: '/super-admin/dashboard', order: 2, isVisible: true },
    { menuKey: 'platform_builder', label: 'Platform Builder', icon: 'Wrench', route: '/super-admin/platform-builder', order: 3, isVisible: true },
    { menuKey: 'users_directory', label: 'Users Directory', icon: 'Users', route: '/super-admin/users', order: 4, isVisible: true },
    { menuKey: 'teams_directory', label: 'Teams Directory', icon: 'UsersRound', route: '/super-admin/teams', order: 5, isVisible: true }
  ],
  ADMIN: [
    { menuKey: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/', order: 1, isVisible: true },
    { menuKey: 'interns', label: 'Interns Registry', icon: 'GraduationCap', route: '/interns', order: 2, isVisible: true },
    { menuKey: 'employees', label: 'Employees Registry', icon: 'UserCheck', route: '/employees', order: 3, isVisible: true },
    { menuKey: 'team_leaders', label: 'Team Leaders', icon: 'UserCog', route: '/team-leaders', order: 4, isVisible: true },
    { menuKey: 'projects', label: 'Projects', icon: 'FolderKanban', route: '/projects', order: 5, isVisible: true },
    { menuKey: 'tasks', label: 'Tasks', icon: 'CheckSquare', route: '/tasks', order: 6, isVisible: true }
  ],
  EMPLOYEE: [
    { menuKey: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/', order: 1, isVisible: true },
    { menuKey: 'projects', label: 'Projects', icon: 'FolderKanban', route: '/projects', order: 2, isVisible: true },
    { menuKey: 'tasks', label: 'Tasks', icon: 'CheckSquare', route: '/tasks', order: 3, isVisible: true },
    { menuKey: 'attendance', label: 'Attendance', icon: 'Clock', route: '/attendance', order: 4, isVisible: true },
    { menuKey: 'chat', label: 'Company Chat', icon: 'MessageSquare', route: '/chat', order: 5, isVisible: true }
  ],
  INTERN: [
    { menuKey: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/', order: 1, isVisible: true },
    { menuKey: 'tasks', label: 'My Tasks', icon: 'CheckSquare', route: '/tasks', order: 2, isVisible: true },
    { menuKey: 'attendance', label: 'My Attendance', icon: 'Clock', route: '/attendance', order: 3, isVisible: true },
    { menuKey: 'chat', label: 'Chat', icon: 'MessageSquare', route: '/chat', order: 4, isVisible: true }
  ]
};

/**
 * 1. Get Platform Builder Dashboard Overview
 */
const getPlatformBuilderDashboard = async (req, res) => {
  try {
    const [publishedVersionsCount, totalFieldsCount, totalMenuRules, historyLogs] = await Promise.all([
      prisma.customFormVersion.count({ where: { status: 'PUBLISHED' } }),
      prisma.customFormField.count(),
      prisma.dynamicMenu.count(),
      prisma.builderHistory.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { performedBy: { select: { id: true, name: true, role: true } } }
      })
    ]);

    const activeSchemas = await prisma.customFormVersion.findMany({
      where: { status: 'PUBLISHED' },
      select: { entityType: true, version: true, publishedAt: true, _count: { select: { fields: true } } }
    });

    res.json({
      metrics: {
        publishedVersionsCount,
        totalFieldsCount,
        totalMenuRules,
        activeEntitiesCount: activeSchemas.length
      },
      activeSchemas,
      recentLogs: historyLogs
    });
  } catch (error) {
    console.error('Get platform builder dashboard error:', error);
    res.status(500).json({ message: 'Failed to load platform builder metrics.' });
  }
};

/**
 * 2. Get Form Schema (DRAFT or PUBLISHED) for an Entity Type
 */
const getFormSchema = async (req, res) => {
  try {
    const { entityType } = req.params;
    const { status = 'PUBLISHED' } = req.query; // DRAFT or PUBLISHED

    let versionRecord = await prisma.customFormVersion.findFirst({
      where: { entityType, status },
      include: {
        fields: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { version: 'desc' }
    });

    // If requesting DRAFT and no draft exists, check if published version exists to initialize draft from
    if (!versionRecord && status === 'DRAFT') {
      const publishedVersion = await prisma.customFormVersion.findFirst({
        where: { entityType, status: 'PUBLISHED' },
        include: { fields: { orderBy: { order: 'asc' } } },
        orderBy: { version: 'desc' }
      });

      const nextVersionNum = publishedVersion ? publishedVersion.version + 1 : 1;

      // Seed fields from Published or System Defaults
      const fieldsToSeed = publishedVersion && publishedVersion.fields.length > 0
        ? publishedVersion.fields.map(f => ({
            fieldKey: f.fieldKey,
            label: f.label,
            placeholder: f.placeholder,
            fieldType: f.fieldType,
            options: f.options,
            visibleTo: f.visibleTo,
            editableBy: f.editableBy,
            requiredFor: f.requiredFor,
            minLength: f.minLength,
            maxLength: f.maxLength,
            minVal: f.minVal,
            maxVal: f.maxVal,
            regexPattern: f.regexPattern,
            defaultValue: f.defaultValue,
            isUnique: f.isUnique,
            isReadOnly: f.isReadOnly,
            isHidden: f.isHidden,
            isDisabled: f.isDisabled,
            dependsOnField: f.dependsOnField,
            dependsOnOperator: f.dependsOnOperator,
            dependsOnValue: f.dependsOnValue,
            isSystemDefault: f.isSystemDefault,
            order: f.order
          }))
        : (SYSTEM_DEFAULT_FIELDS[entityType] || SYSTEM_DEFAULT_FIELDS.USER_PROFILE);

      versionRecord = await prisma.customFormVersion.create({
        data: {
          entityType,
          version: nextVersionNum,
          status: 'DRAFT',
          createdById: req.user.id,
          fields: {
            create: fieldsToSeed.map(f => ({
              entityType,
              fieldKey: f.fieldKey,
              label: f.label,
              placeholder: f.placeholder || null,
              fieldType: f.fieldType || 'TEXT',
              options: f.options || null,
              visibleTo: f.visibleTo || ['ALL'],
              editableBy: f.editableBy || ['ALL'],
              requiredFor: f.requiredFor || [],
              minLength: f.minLength || null,
              maxLength: f.maxLength || null,
              minVal: f.minVal !== undefined ? f.minVal : null,
              maxVal: f.maxVal !== undefined ? f.maxVal : null,
              regexPattern: f.regexPattern || null,
              defaultValue: f.defaultValue || null,
              isUnique: f.isUnique || false,
              isReadOnly: f.isReadOnly || false,
              isHidden: f.isHidden || false,
              isDisabled: f.isDisabled || false,
              dependsOnField: f.dependsOnField || null,
              dependsOnOperator: f.dependsOnOperator || null,
              dependsOnValue: f.dependsOnValue || null,
              isSystemDefault: f.isSystemDefault || false,
              order: f.order || 1
            }))
          }
        },
        include: {
          fields: { orderBy: { order: 'asc' } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });
    }

    // Fallback for PUBLISHED if no published version exists
    if (!versionRecord && status === 'PUBLISHED') {
      const draft = await prisma.customFormVersion.findFirst({
        where: { entityType, status: 'DRAFT' },
        include: { fields: { orderBy: { order: 'asc' } } }
      });
      versionRecord = draft;
    }

    res.json(versionRecord || { entityType, version: 1, status: 'DRAFT', fields: SYSTEM_DEFAULT_FIELDS[entityType] || [] });
  } catch (error) {
    console.error('Get form schema error:', error);
    res.status(500).json({ message: 'Failed to retrieve form schema.' });
  }
};

/**
 * 3. Save Working Draft for an Entity Type
 */
const saveFormDraft = async (req, res) => {
  try {
    const { entityType } = req.params;
    const { fields } = req.body; // Array of field objects

    if (!Array.isArray(fields)) {
      return res.status(400).json({ message: 'Fields must be an array.' });
    }

    let draftVersion = await prisma.customFormVersion.findFirst({
      where: { entityType, status: 'DRAFT' },
      orderBy: { version: 'desc' }
    });

    if (!draftVersion) {
      const latestPublished = await prisma.customFormVersion.findFirst({
        where: { entityType, status: 'PUBLISHED' },
        orderBy: { version: 'desc' }
      });
      const nextVer = latestPublished ? latestPublished.version + 1 : 1;

      draftVersion = await prisma.customFormVersion.create({
        data: {
          entityType,
          version: nextVer,
          status: 'DRAFT',
          createdById: req.user.id
        }
      });
    }

    // Delete existing draft fields and recreate with new configuration
    await prisma.customFormField.deleteMany({
      where: { versionId: draftVersion.id }
    });

    await prisma.customFormField.createMany({
      data: fields.map((f, idx) => ({
        versionId: draftVersion.id,
        entityType,
        fieldKey: f.fieldKey || `field_${Date.now()}_${idx}`,
        label: f.label || 'Untitled Field',
        placeholder: f.placeholder || null,
        fieldType: f.fieldType || 'TEXT',
        options: f.options || null,
        visibleTo: f.visibleTo || ['ALL'],
        editableBy: f.editableBy || ['ALL'],
        requiredFor: f.requiredFor || [],
        minLength: f.minLength ? parseInt(f.minLength) : null,
        maxLength: f.maxLength ? parseInt(f.maxLength) : null,
        minVal: f.minVal !== undefined && f.minVal !== null && f.minVal !== '' ? parseFloat(f.minVal) : null,
        maxVal: f.maxVal !== undefined && f.maxVal !== null && f.maxVal !== '' ? parseFloat(f.maxVal) : null,
        regexPattern: f.regexPattern || null,
        defaultValue: f.defaultValue || null,
        isUnique: !!f.isUnique,
        isReadOnly: !!f.isReadOnly,
        isHidden: !!f.isHidden,
        isDisabled: !!f.isDisabled,
        dependsOnField: f.dependsOnField || null,
        dependsOnOperator: f.dependsOnOperator || null,
        dependsOnValue: f.dependsOnValue || null,
        isSystemDefault: !!f.isSystemDefault,
        order: f.order !== undefined ? parseInt(f.order) : idx + 1
      }))
    });

    await prisma.builderHistory.create({
      data: {
        performedById: req.user.id,
        builderType: 'FORM',
        entityType,
        action: 'SAVE_DRAFT',
        details: `Saved DRAFT form schema for '${entityType}' (Version ${draftVersion.version}, ${fields.length} fields)`
      }
    });

    const updated = await prisma.customFormVersion.findUnique({
      where: { id: draftVersion.id },
      include: { fields: { orderBy: { order: 'asc' } } }
    });

    res.json(updated);
  } catch (error) {
    console.error('Save form draft error:', error);
    res.status(500).json({ message: 'Failed to save form draft.' });
  }
};

/**
 * 4. Pre-Publish Impact Analysis
 */
const analyzePublishImpact = async (req, res) => {
  try {
    const { entityType } = req.params;

    const [draftVersion, currentPublished] = await Promise.all([
      prisma.customFormVersion.findFirst({
        where: { entityType, status: 'DRAFT' },
        include: { fields: true }
      }),
      prisma.customFormVersion.findFirst({
        where: { entityType, status: 'PUBLISHED' },
        include: { fields: true }
      })
    ]);

    if (!draftVersion) {
      return res.status(400).json({ message: 'No active DRAFT schema found to publish.' });
    }

    const draftKeys = draftVersion.fields.map(f => f.fieldKey);
    const pubKeys = currentPublished ? currentPublished.fields.map(f => f.fieldKey) : [];

    const addedFields = draftVersion.fields.filter(f => !pubKeys.includes(f.fieldKey));
    const removedFields = currentPublished ? currentPublished.fields.filter(f => !draftKeys.includes(f.fieldKey)) : [];

    const modifiedFields = [];
    if (currentPublished) {
      draftVersion.fields.forEach(df => {
        const pf = currentPublished.fields.find(p => p.fieldKey === df.fieldKey);
        if (pf && (
          pf.label !== df.label ||
          pf.fieldType !== df.fieldType ||
          pf.regexPattern !== df.regexPattern ||
          JSON.stringify(pf.requiredFor) !== JSON.stringify(df.requiredFor) ||
          JSON.stringify(pf.visibleTo) !== JSON.stringify(df.visibleTo)
        )) {
          modifiedFields.push({ key: df.fieldKey, oldLabel: pf.label, newLabel: df.label });
        }
      });
    }

    let affectedUserRole = 'ALL';
    if (entityType.includes('INTERN')) affectedUserRole = 'INTERN';
    if (entityType.includes('EMPLOYEE')) affectedUserRole = 'EMPLOYEE';
    if (entityType.includes('TEAM_LEADER')) affectedUserRole = 'TEAM_LEADER';
    if (entityType.includes('ADMIN')) affectedUserRole = 'ADMIN';

    const userCountWhere = affectedUserRole === 'ALL' ? {} : { role: affectedUserRole };
    const estimatedUsersCount = await prisma.user.count({ where: userCountWhere });

    const affectedModules = [
      'Registration Forms & Entry Points',
      'User Profile Page & Edit Drawer',
      'Admin Directory & Dynamic Filters',
      'CSV / Excel Export Services',
      'REST API Input Validation Pipeline'
    ];

    res.json({
      entityType,
      draftVersion: draftVersion.version,
      addedFields: addedFields.map(f => ({ key: f.fieldKey, label: f.label, type: f.fieldType })),
      removedFields: removedFields.map(f => ({ key: f.fieldKey, label: f.label })),
      modifiedFieldsCount: modifiedFields.length,
      modifiedFields,
      affectedModules,
      estimatedUsersCount
    });
  } catch (error) {
    console.error('Analyze publish impact error:', error);
    res.status(500).json({ message: 'Failed to generate publish impact analysis.' });
  }
};

/**
 * 5. Publish Form Schema (Guaranteeing ONLY ONE Active Published Version)
 */
const publishFormSchema = async (req, res) => {
  try {
    const { entityType } = req.params;

    const draftVersion = await prisma.customFormVersion.findFirst({
      where: { entityType, status: 'DRAFT' },
      include: { fields: true }
    });

    if (!draftVersion) {
      return res.status(400).json({ message: 'No active draft found to publish.' });
    }

    // STEP 1: Archive any existing active PUBLISHED versions for this entityType
    await prisma.customFormVersion.updateMany({
      where: { entityType, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' }
    });

    // STEP 2: Mark current DRAFT version as active PUBLISHED
    const publishedVersion = await prisma.customFormVersion.update({
      where: { id: draftVersion.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      include: { fields: { orderBy: { order: 'asc' } } }
    });

    // STEP 3: Create a fresh new DRAFT version cloned from the published version for future edits
    await prisma.customFormVersion.create({
      data: {
        entityType,
        version: publishedVersion.version + 1,
        status: 'DRAFT',
        createdById: req.user.id,
        fields: {
          create: publishedVersion.fields.map(f => ({
            entityType,
            fieldKey: f.fieldKey,
            label: f.label,
            placeholder: f.placeholder,
            fieldType: f.fieldType,
            options: f.options,
            visibleTo: f.visibleTo,
            editableBy: f.editableBy,
            requiredFor: f.requiredFor,
            minLength: f.minLength,
            maxLength: f.maxLength,
            minVal: f.minVal,
            maxVal: f.maxVal,
            regexPattern: f.regexPattern,
            defaultValue: f.defaultValue,
            isUnique: f.isUnique,
            isReadOnly: f.isReadOnly,
            isHidden: f.isHidden,
            isDisabled: f.isDisabled,
            dependsOnField: f.dependsOnField,
            dependsOnOperator: f.dependsOnOperator,
            dependsOnValue: f.dependsOnValue,
            isSystemDefault: f.isSystemDefault,
            order: f.order
          }))
        }
      }
    });

    // STEP 4: Audit Trail Log
    await prisma.builderHistory.create({
      data: {
        performedById: req.user.id,
        builderType: 'FORM',
        entityType,
        action: 'PUBLISH',
        details: `PUBLISHED Form schema Version ${publishedVersion.version} for '${entityType}' with ${publishedVersion.fields.length} fields`
      }
    });

    await logActivity({
      userId: req.user.id,
      action: 'SUPER_ADMIN_PUBLISH_FORM_SCHEMA',
      details: `Published Form Schema Version ${publishedVersion.version} for ${entityType}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json(publishedVersion);
  } catch (error) {
    console.error('Publish form schema error:', error);
    res.status(500).json({ message: 'Failed to publish form schema.' });
  }
};

/**
 * 6. Rollback to Historical Form Version
 */
const rollbackFormSchema = async (req, res) => {
  try {
    const { entityType, versionId } = req.params;

    const targetVersion = await prisma.customFormVersion.findUnique({
      where: { id: versionId },
      include: { fields: true }
    });

    if (!targetVersion || targetVersion.entityType !== entityType) {
      return res.status(404).json({ message: 'Target version not found.' });
    }

    // Archive current active PUBLISHED versions
    await prisma.customFormVersion.updateMany({
      where: { entityType, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' }
    });

    const latestVerNumRecord = await prisma.customFormVersion.findFirst({
      where: { entityType },
      orderBy: { version: 'desc' }
    });
    const newVerNum = (latestVerNumRecord ? latestVerNumRecord.version : 1) + 1;

    // Create new active PUBLISHED version cloned from target
    const rolledBackVersion = await prisma.customFormVersion.create({
      data: {
        entityType,
        version: newVerNum,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdById: req.user.id,
        fields: {
          create: targetVersion.fields.map(f => ({
            entityType,
            fieldKey: f.fieldKey,
            label: f.label,
            placeholder: f.placeholder,
            fieldType: f.fieldType,
            options: f.options,
            visibleTo: f.visibleTo,
            editableBy: f.editableBy,
            requiredFor: f.requiredFor,
            minLength: f.minLength,
            maxLength: f.maxLength,
            minVal: f.minVal,
            maxVal: f.maxVal,
            regexPattern: f.regexPattern,
            defaultValue: f.defaultValue,
            isUnique: f.isUnique,
            isReadOnly: f.isReadOnly,
            isHidden: f.isHidden,
            isDisabled: f.isDisabled,
            dependsOnField: f.dependsOnField,
            dependsOnOperator: f.dependsOnOperator,
            dependsOnValue: f.dependsOnValue,
            isSystemDefault: f.isSystemDefault,
            order: f.order
          }))
        }
      },
      include: { fields: { orderBy: { order: 'asc' } } }
    });

    // Also update draft to match rolled back version
    await prisma.customFormVersion.deleteMany({ where: { entityType, status: 'DRAFT' } });
    await prisma.customFormVersion.create({
      data: {
        entityType,
        version: newVerNum + 1,
        status: 'DRAFT',
        createdById: req.user.id,
        fields: {
          create: targetVersion.fields.map(f => ({
            entityType,
            fieldKey: f.fieldKey,
            label: f.label,
            placeholder: f.placeholder,
            fieldType: f.fieldType,
            options: f.options,
            visibleTo: f.visibleTo,
            editableBy: f.editableBy,
            requiredFor: f.requiredFor,
            minLength: f.minLength,
            maxLength: f.maxLength,
            minVal: f.minVal,
            maxVal: f.maxVal,
            regexPattern: f.regexPattern,
            defaultValue: f.defaultValue,
            isUnique: f.isUnique,
            isReadOnly: f.isReadOnly,
            isHidden: f.isHidden,
            isDisabled: f.isDisabled,
            dependsOnField: f.dependsOnField,
            dependsOnOperator: f.dependsOnOperator,
            dependsOnValue: f.dependsOnValue,
            isSystemDefault: f.isSystemDefault,
            order: f.order
          }))
        }
      }
    });

    await prisma.builderHistory.create({
      data: {
        performedById: req.user.id,
        builderType: 'FORM',
        entityType,
        action: 'ROLLBACK',
        details: `Rolled back '${entityType}' schema to snapshot of Version ${targetVersion.version} (Published as Version ${newVerNum})`
      }
    });

    res.json(rolledBackVersion);
  } catch (error) {
    console.error('Rollback form schema error:', error);
    res.status(500).json({ message: 'Failed to rollback form schema.' });
  }
};

/**
 * 7. Get Form Version History & Audits
 */
const getFormVersionHistory = async (req, res) => {
  try {
    const { entityType } = req.params;

    const [versions, auditLogs] = await Promise.all([
      prisma.customFormVersion.findMany({
        where: { entityType },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          _count: { select: { fields: true } }
        },
        orderBy: { version: 'desc' }
      }),
      prisma.builderHistory.findMany({
        where: { entityType, builderType: 'FORM' },
        include: { performedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    ]);

    res.json({ versions, auditLogs });
  } catch (error) {
    console.error('Get form version history error:', error);
    res.status(500).json({ message: 'Failed to retrieve form version history.' });
  }
};

/**
 * 8. Get Dynamic Menu Tree for a Role
 */
const getMenuHierarchy = async (req, res) => {
  try {
    const { role } = req.params;

    let menus = await prisma.dynamicMenu.findMany({
      where: { role },
      orderBy: { order: 'asc' }
    });

    if (menus.length === 0) {
      const defaults = DEFAULT_ROLE_MENUS[role] || DEFAULT_ROLE_MENUS.EMPLOYEE;
      const created = await Promise.all(
        defaults.map(m =>
          prisma.dynamicMenu.create({
            data: {
              role,
              menuKey: m.menuKey,
              label: m.label,
              icon: m.icon,
              route: m.route,
              order: m.order,
              isVisible: m.isVisible
            }
          })
        )
      );
      menus = created;
    }

    res.json(menus);
  } catch (error) {
    console.error('Get menu hierarchy error:', error);
    res.status(500).json({ message: 'Failed to retrieve menu hierarchy.' });
  }
};

/**
 * 9. Update Dynamic Menu Tree for a Role
 */
const updateMenuHierarchy = async (req, res) => {
  try {
    const { role } = req.params;
    const { menus } = req.body; // Array of menu objects

    if (!Array.isArray(menus)) {
      return res.status(400).json({ message: 'Menus payload must be an array.' });
    }

    // Delete existing menus for this role and re-insert updated array
    await prisma.dynamicMenu.deleteMany({ where: { role } });

    const updated = await Promise.all(
      menus.map((m, idx) =>
        prisma.dynamicMenu.create({
          data: {
            role,
            menuKey: m.menuKey || `menu_${Date.now()}_${idx}`,
            label: m.label,
            icon: m.icon || null,
            route: m.route || '/',
            permission: m.permission || null,
            badge: m.badge || null,
            order: m.order !== undefined ? parseInt(m.order) : idx + 1,
            isVisible: m.isVisible !== undefined ? !!m.isVisible : true,
            parentId: m.parentId || null
          }
        })
      )
    );

    await prisma.builderHistory.create({
      data: {
        performedById: req.user.id,
        builderType: 'MENU',
        action: 'UPDATE_MENU',
        details: `Updated sidebar menu configuration for role '${role}' (${updated.length} menu items)`
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update menu hierarchy error:', error);
    res.status(500).json({ message: 'Failed to update menu hierarchy.' });
  }
};

module.exports = {
  getPlatformBuilderDashboard,
  getFormSchema,
  saveFormDraft,
  analyzePublishImpact,
  publishFormSchema,
  rollbackFormSchema,
  getFormVersionHistory,
  getMenuHierarchy,
  updateMenuHierarchy
};
