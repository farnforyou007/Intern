| table_name             | column_name       | constraint_type | foreign_table_name     | foreign_column_name |
| ---------------------- | ----------------- | --------------- | ---------------------- | ------------------- |
| evaluation_logs        | id                | PRIMARY KEY     | evaluation_logs        | id                  |
| evaluation_logs        | assignment_id     | FOREIGN KEY     | student_assignments    | id                  |
| evaluation_logs        | group_id          | FOREIGN KEY     | evaluation_groups      | id                  |
| evaluation_logs        | supervisor_id     | FOREIGN KEY     | supervisors            | id                  |
| evaluation_logs        | assignment_id     | UNIQUE          | evaluation_logs        | assignment_id       |
| evaluation_logs        | assignment_id     | UNIQUE          | evaluation_logs        | group_id            |
| evaluation_logs        | assignment_id     | UNIQUE          | evaluation_logs        | supervisor_id       |
| evaluation_logs        | group_id          | UNIQUE          | evaluation_logs        | assignment_id       |
| evaluation_logs        | group_id          | UNIQUE          | evaluation_logs        | group_id            |
| evaluation_logs        | group_id          | UNIQUE          | evaluation_logs        | supervisor_id       |
| evaluation_logs        | supervisor_id     | UNIQUE          | evaluation_logs        | assignment_id       |
| evaluation_logs        | supervisor_id     | UNIQUE          | evaluation_logs        | group_id            |
| evaluation_logs        | supervisor_id     | UNIQUE          | evaluation_logs        | supervisor_id       |
| evaluation_answers     | item_id           | FOREIGN KEY     | evaluation_items       | id                  |
| evaluation_answers     | log_id            | FOREIGN KEY     | evaluation_logs        | id                  |
| evaluation_answers     | id                | PRIMARY KEY     | evaluation_answers     | id                  |
| evaluation_answers     | log_id            | UNIQUE          | evaluation_answers     | item_id             |
| evaluation_answers     | log_id            | UNIQUE          | evaluation_answers     | log_id              |
| evaluation_answers     | item_id           | UNIQUE          | evaluation_answers     | item_id             |
| evaluation_answers     | item_id           | UNIQUE          | evaluation_answers     | log_id              |
| training_sites         | invite_code       | UNIQUE          | training_sites         | invite_code         |
| training_sites         | id                | PRIMARY KEY     | training_sites         | id                  |
| eval_template_items    | id                | PRIMARY KEY     | eval_template_items    | id                  |
| eval_template_items    | template_id       | FOREIGN KEY     | eval_templates         | id                  |
| evaluation_items       | group_id          | FOREIGN KEY     | evaluation_groups      | id                  |
| evaluation_items       | id                | PRIMARY KEY     | evaluation_items       | id                  |
| assignment_supervisors | assignment_id     | FOREIGN KEY     | student_assignments    | id                  |
| assignment_supervisors | id                | PRIMARY KEY     | assignment_supervisors | id                  |
| assignment_supervisors | supervisor_id     | FOREIGN KEY     | supervisors            | id                  |
| sub_subjects           | parent_subject_id | FOREIGN KEY     | subjects               | id                  |
| sub_subjects           | id                | PRIMARY KEY     | sub_subjects           | id                  |
| supervisors            | line_user_id      | UNIQUE          | supervisors            | line_user_id        |
| supervisors            | id                | PRIMARY KEY     | supervisors            | id                  |
| supervisors            | site_id           | FOREIGN KEY     | training_sites         | id                  |
| subject_teachers       | id                | PRIMARY KEY     | subject_teachers       | id                  |
| subject_teachers       | subject_id        | FOREIGN KEY     | subjects               | id                  |
| subject_teachers       | teacher_id        | FOREIGN KEY     | supervisors            | id                  |
| system_configs         | key_name          | UNIQUE          | system_configs         | key_name            |
| system_configs         | id                | PRIMARY KEY     | system_configs         | id                  |
| subjects               | id                | PRIMARY KEY     | subjects               | id                  |
| supervisor_subjects    | id                | PRIMARY KEY     | supervisor_subjects    | id                  |
| supervisor_subjects    | sub_subject_id    | FOREIGN KEY     | sub_subjects           | id                  |
| supervisor_subjects    | subject_id        | FOREIGN KEY     | subjects               | id                  |
| supervisor_subjects    | supervisor_id     | FOREIGN KEY     | supervisors            | id                  |
| rotations              | id                | PRIMARY KEY     | rotations              | id                  |
| rotation_subjects      | id                | PRIMARY KEY     | rotation_subjects      | id                  |
| rotation_subjects      | rotation_id       | FOREIGN KEY     | rotations              | id                  |
| rotation_subjects      | subject_id        | FOREIGN KEY     | subjects               | id                  |
| student_assignments    | faculty_id        | FOREIGN KEY     | supervisors            | id                  |
| student_assignments    | id                | PRIMARY KEY     | student_assignments    | id                  |
| student_assignments    | rotation_id       | FOREIGN KEY     | rotations              | id                  |
| student_assignments    | site_id           | FOREIGN KEY     | training_sites         | id                  |
| student_assignments    | student_id        | FOREIGN KEY     | students               | id                  |
| student_assignments    | sub_subject_id    | FOREIGN KEY     | sub_subjects           | id                  |
| student_assignments    | subject_id        | FOREIGN KEY     | subjects               | id                  |
| students               | id                | PRIMARY KEY     | students               | id                  |
| students               | student_code      | UNIQUE          | students               | student_code        |
| eval_templates         | id                | PRIMARY KEY     | eval_templates         | id                  |
| evaluation_groups      | id                | PRIMARY KEY     | evaluation_groups      | id                  |
| evaluation_groups      | sub_subject_id    | FOREIGN KEY     | sub_subjects           | id                  |
| evaluation_groups      | subject_id        | FOREIGN KEY     | subjects               | id                  |