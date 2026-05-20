SET search_path TO demos_app;

DELETE FROM 
  demos_app.role_permission
WHERE
  permission_id IN (
    'View All ApplicationPhases',
    'View ApplicationPhases on Assigned Demonstrations',
    'View All ApplicationDates',
    'View ApplicationDates on Assigned Demonstrations',
    'View All ApplicationNotes',
    'View ApplicationNotes on Assigned Demonstrations',
    'View All ApplicationTagAssignments',
    'View ApplicationTagAssignments on Assigned Demonstrations',
    'View All DemonstrationTypeTagAssignments',
    'View DemonstrationTypeTagAssignments on Assigned Demonstrations',
    'View All DeliverableDemonstrationTypes',
    'View DeliverableDemonstrationTypes on Assigned Demonstrations',
    'View All DemonstrationRoleAssignments',
    'View DemonstrationRoleAssignments on Assigned Demonstrations',
    'View All ApplicationTagSuggestions',
    'View ApplicationTagSuggestions on Assigned Demonstrations',
    'View All People',
    'View People on Assigned Demonstrations',
    'View My Person',
    'View All SystemRoleAssignments',
    'View My SystemRoleAssignments',
    'View All Users',
    'View Users on Assigned Demonstrations',
    'View My User'
  )
;

DELETE FROM 
  demos_app.permission
WHERE
  id IN (
    'View All ApplicationPhases',
    'View ApplicationPhases on Assigned Demonstrations',
    'View All ApplicationDates',
    'View ApplicationDates on Assigned Demonstrations',
    'View All ApplicationNotes',
    'View ApplicationNotes on Assigned Demonstrations',
    'View All ApplicationTagAssignments',
    'View ApplicationTagAssignments on Assigned Demonstrations',
    'View All DemonstrationTypeTagAssignments',
    'View DemonstrationTypeTagAssignments on Assigned Demonstrations',
    'View All DeliverableDemonstrationTypes',
    'View DeliverableDemonstrationTypes on Assigned Demonstrations',
    'View All DemonstrationRoleAssignments',
    'View DemonstrationRoleAssignments on Assigned Demonstrations',
    'View All ApplicationTagSuggestions',
    'View ApplicationTagSuggestions on Assigned Demonstrations',
    'View All People',
    'View People on Assigned Demonstrations',
    'View My Person',
    'View All SystemRoleAssignments',
    'View My SystemRoleAssignments',
    'View All Users',
    'View Users on Assigned Demonstrations',
    'View My User'
  )
;
