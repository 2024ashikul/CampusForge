import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, Users } from 'lucide-react';
import { getSkillsApi, getStudentsBySkillApi, type SkillStudent, type SkillSummary } from '../services/api';
import { UserAvatar } from '../components/ui/UserAvatar';

const levelClass: Record<string, string> = {
  Advanced: 'skill-badge-advanced', Intermediate: 'skill-badge-intermediate', Beginner: 'skill-badge-beginner',
};

export const Skills: React.FC = () => {
  const { skillName } = useParams<{ skillName: string }>();
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [students, setStudents] = useState<SkillStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const request = skillName ? getStudentsBySkillApi(skillName).then(setStudents) : getSkillsApi().then(setSkills);
    request.finally(() => setLoading(false));
  }, [skillName]);

  if (loading) return <div className="min-h-screen bg-primary flex items-center justify-center"><Loader2 className="w-7 h-7 text-accent animate-spin" /></div>;

  if (!skillName) return <div className="page-container">
    <header className="page-header"><div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-accent" /><span className="text-xs font-bold uppercase tracking-widest text-accent">Campus expertise</span></div><h1 className="page-title">Skills directory</h1><p className="page-subtitle">Browse skills and discover students ready to collaborate.</p></header>
    {skills.length === 0 ? <p className="text-subText text-sm">No skills have been added yet.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{skills.map(({ skill, student_count }) => <Link key={skill} to={`/skills/${encodeURIComponent(skill)}`} className="glass-panel rounded-2xl p-5 hover:border-accent/60 transition-colors"><h2 className="font-bold text-mainText">{skill}</h2><p className="text-xs text-accent mt-2">{student_count} student{student_count === 1 ? '' : 's'} →</p></Link>)}</div>}
  </div>;

  const displayName = students[0]?.skill ?? skillName;
  return <div className="page-container">
    <Link to="/skills" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mb-5"><ArrowLeft className="w-3.5 h-3.5" /> All skills</Link>
    <header className="page-header"><div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-accent" /><span className="text-xs font-bold uppercase tracking-widest text-accent">Skill community</span></div><h1 className="page-title">Students skilled in {displayName}</h1><p className="page-subtitle">Meet the people building with this skill across campus.</p></header>
    {students.length === 0 ? <p className="text-subText text-sm">No students currently list this skill.</p> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{students.map(student => <Link key={student.student_id} to={`/profile/${student.student_id}`} className="glass-panel rounded-2xl p-5 hover:border-accent/60 transition-colors"><div className="flex items-center gap-3"><UserAvatar name={student.name} src={student.profile_pic} className="h-11 w-11 rounded-xl" /><div><h2 className="font-bold">{student.name}</h2><p className="text-[11px] text-subText">{student.department}</p></div></div><div className="mt-4 flex items-center justify-between"><span className={`skill-badge text-[10px] py-0.5 px-2 ${levelClass[student.skill_level] ?? levelClass.Beginner}`}>{student.skill_level}</span><span className="text-[10px] text-accent flex items-center gap-1"><Users className="w-3 h-3" /> View profile</span></div></Link>)}</div>}
  </div>;
};

export default Skills;
