import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, doc, setDoc, getDocs, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "../styles/AddCourse.css";

const AddCoursePage = () => {
    // Form state
    const [collegeId, setCollegeId] = useState("");
    const [showNewCollegeForm, setShowNewCollegeForm] = useState(false);
    const [courseName, setCourseName] = useState("");
    const [courseDetails, setCourseDetails] = useState({
        duration: "",
        benefits: "",
        eligibility: "",
        placement: ""
    });

    // New college form state
    const [newCollege, setNewCollege] = useState({
        name: "",
        affliatedTo: "",
        district: "",
        state: "",
        type: "",
        establishedYear: "",
        website: "",
        description: ""
    });

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingColleges, setExistingColleges] = useState([]);
    const [loadingColleges, setLoadingColleges] = useState(true);

    // Fetch existing colleges
    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "km-colleges"));
                const colleges = [];
                querySnapshot.forEach((doc) => {
                    colleges.push({ id: doc.id, ...doc.data() });
                });
                setExistingColleges(colleges);
            } catch (error) {
                console.error("Error fetching colleges:", error);
                toast.error("Failed to load colleges list");
            } finally {
                setLoadingColleges(false);
            }
        };

        fetchColleges();
    }, []);

    // Handle new college input changes
    const handleNewCollegeChange = (e) => {
        const { name, value } = e.target;
        setNewCollege(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Create new college
    const createNewCollege = async () => {
        if (!newCollege.name.trim()) {
            toast.error("Please enter a college name");
            return;
        }

        try {
            setIsSubmitting(true);
            const newCollegeRef = doc(collection(db, "km-colleges"));

            await setDoc(newCollegeRef, {
                ...newCollege,
                name: newCollege.name.trim(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                courseCount: 0
            });

            // Update local state
            const createdCollege = {
                id: newCollegeRef.id,
                name: newCollege.name.trim(),
                ...newCollege
            };
            setExistingColleges([...existingColleges, createdCollege]);
            setCollegeId(newCollegeRef.id);

            toast.success(`College "${newCollege.name}" created successfully!`);
            setNewCollege({
                name: "",
                affliatedTo: "",
                district: "",
                state: "",
                type: "",
                establishedYear: "",
                website: "",
                description: ""
            });
            setShowNewCollegeForm(false);
        } catch (error) {
            console.error("Error creating college:", error);
            toast.error("Failed to create college. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add new course
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!collegeId) {
            toast.error("Please select or create a college");
            setIsSubmitting(false);
            return;
        }

        if (!courseName.trim()) {
            toast.error("Please enter a course name");
            setIsSubmitting(false);
            return;
        }

        const courseData = {
            name: courseName.trim(),
            collegeId: collegeId,
            collegeName: existingColleges.find(c => c.id === collegeId)?.name || newCollege.name,
            ...courseDetails,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            // Add to courses collection
            const coursesRef = collection(db, "km-courses");
            await addDoc(coursesRef, courseData);

            // Update college's course count
            const collegeRef = doc(db, "km-colleges", collegeId);
            await setDoc(collegeRef,
                {
                    courseCount: (existingColleges.find(c => c.id === collegeId)?.courseCount || 0) + 1,
                    updatedAt: new Date().toISOString()
                },
                { merge: true }
            );

            toast.success(`Course "${courseName}" created successfully!`);

            // Reset form (keep college selection)
            setCourseName("");
            setCourseDetails({
                duration: "",
                benefits: "",
                eligibility: "",
                placement: ""
            });
        } catch (error) {
            console.error("Firebase error:", error);
            toast.error(`Failed to create course. ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCourseDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loadingColleges) {
        return (
            <div className="add_course_container">
                <div className="add_course_loading">
                    <div className="add_course_spinner"></div>
                    <p>Loading colleges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="add_course_container">
            <div className="add_course_card">
                <div className="add_course_header">
                    <h2 className="add_course_title">Add New Course</h2>
                    <p className="add_course_subtitle">Create a new course in the system</p>
                </div>

                <form onSubmit={handleSubmit} className="add_course_form">
                    {/* College Selection */}
                    <div className="add_course_form_group">
                        <label htmlFor="collegeId" className="add_course_label">
                            College <span className="add_course_required">*</span>
                        </label>

                        {!showNewCollegeForm ? (
                            <>
                                <select
                                    id="collegeId"
                                    value={collegeId}
                                    onChange={(e) => setCollegeId(e.target.value)}
                                    className="add_course_input"
                                    required
                                >
                                    <option value="">Select a college</option>
                                    {existingColleges.map(college => (
                                        <option key={college.id} value={college.id}>
                                            {college.name} - {college.district}, {college.state}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="add_college_toggle_btn"
                                    onClick={() => setShowNewCollegeForm(true)}
                                >
                                    + Add New College
                                </button>
                            </>
                        ) : (
                            <div className="new_college_form">
                                <h3 className="new_college_title">Add New College Details</h3>

                                <div className="add_course_form_group">
                                    <label htmlFor="collegeName" className="add_course_label">
                                        College Name <span className="add_course_required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="collegeName"
                                        name="name"
                                        value={newCollege.name}
                                        onChange={handleNewCollegeChange}
                                        placeholder="Enter college name"
                                        className="add_course_input"
                                        required
                                    />
                                </div>
                                
                                <div className="add_course_form_group">
                                    <label htmlFor="affliatedTo" className="add_course_label">
                                        Affiliated To
                                    </label>
                                    <input
                                        type="text"
                                        id="affliatedTo"
                                        name="affliatedTo"
                                        value={newCollege.affliatedTo}
                                        onChange={handleNewCollegeChange}
                                        placeholder="Enter university/board affiliation"
                                        className="add_course_input"
                                    />
                                </div>

                                <div className="add_course_form_group">
                                    <label htmlFor="district" className="add_course_label">
                                        District
                                    </label>
                                    <input
                                        type="text"
                                        id="district"
                                        name="district"
                                        value={newCollege.district}
                                        onChange={handleNewCollegeChange}
                                        placeholder="Enter district"
                                        className="add_course_input"
                                    />
                                </div>

                                <div className="add_course_form_group">
                                    <label htmlFor="state" className="add_course_label">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        id="state"
                                        name="state"
                                        value={newCollege.state}
                                        onChange={handleNewCollegeChange}
                                        placeholder="Enter state"
                                        className="add_course_input"
                                    />
                                </div>

                                <div className="add_course_form_group">
                                    <label htmlFor="type" className="add_course_label">
                                        Type
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={newCollege.type}
                                        onChange={handleNewCollegeChange}
                                        className="add_course_input"
                                    >
                                        <option value="">Select type</option>
                                        <option value="Deemed">Deemed to be University</option>
                                        <option value="Autonomous">Autonomous</option>
                                    </select>
                                </div>

                                <div className="add_course_form_group">
                                    <label htmlFor="establishedYear" className="add_course_label">
                                        Established Year
                                    </label>
                                    <input
                                        type="number"
                                        id="establishedYear"
                                        name="establishedYear"
                                        value={newCollege.establishedYear}
                                        onChange={handleNewCollegeChange}
                                        placeholder="e.g., 1995"
                                        className="add_course_input"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                    />
                                </div>

                                <div className="add_course_form_group">
                                    <label htmlFor="website" className="add_course_label">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        id="website"
                                        name="website"
                                        value={newCollege.website}
                                        onChange={handleNewCollegeChange}
                                        placeholder="https://www.college.edu"
                                        className="add_course_input"
                                    />
                                </div>

                                <div className="add_course_form_group">
                                    <label htmlFor="description" className="add_course_label">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={newCollege.description}
                                        onChange={handleNewCollegeChange}
                                        placeholder="Brief description about the college"
                                        className="add_course_input"
                                        rows="3"
                                    ></textarea>
                                </div>

                                <div className="add_college_actions">
                                    <button
                                        type="button"
                                        className="add_college_secondary_btn"
                                        onClick={() => setShowNewCollegeForm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="add_college_primary_btn"
                                        onClick={createNewCollege}
                                        disabled={isSubmitting || !newCollege.name.trim()}
                                    >
                                        {isSubmitting ? "Creating..." : "Create College"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Course Form (only shown when college is selected) */}
                    {(collegeId || showNewCollegeForm) && (
                        <>
                            <div className="add_course_form_group">
                                <label htmlFor="courseName" className="add_course_label">
                                    Course Name <span className="add_course_required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="courseName"
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    placeholder="E.g., Computer Science Engineering"
                                    className="add_course_input"
                                    required
                                />
                            </div>

                            <div className="add_course_form_group">
                                <label htmlFor="duration" className="add_course_label">
                                    Duration
                                </label>
                                <input
                                    type="text"
                                    id="duration"
                                    name="duration"
                                    value={courseDetails.duration}
                                    onChange={handleInputChange}
                                    placeholder="E.g., 4 years"
                                    className="add_course_input"
                                />
                            </div>

                            <div className="add_course_form_group">
                                <label htmlFor="benefits" className="add_course_label">
                                    Course Benefits
                                </label>
                                <textarea
                                    id="benefits"
                                    name="benefits"
                                    value={courseDetails.benefits}
                                    onChange={handleInputChange}
                                    placeholder="Describe the benefits of this course"
                                    className="add_course_input"
                                    rows="4"
                                ></textarea>
                            </div>

                            <div className="add_course_form_group">
                                <label htmlFor="eligibility" className="add_course_label">
                                    Eligibility Criteria
                                </label>
                                <textarea
                                    id="eligibility"
                                    name="eligibility"
                                    value={courseDetails.eligibility}
                                    onChange={handleInputChange}
                                    placeholder="List the eligibility requirements"
                                    className="add_course_input"
                                    rows="4"
                                ></textarea>
                            </div>

                            <div className="add_course_form_group">
                                <label htmlFor="placement" className="add_course_label">
                                    Placement Details
                                </label>
                                <textarea
                                    id="placement"
                                    name="placement"
                                    value={courseDetails.placement}
                                    onChange={handleInputChange}
                                    placeholder="Describe placement statistics and companies"
                                    className="add_course_input"
                                    rows="4"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className={`add_course_submit_btn ${isSubmitting ? 'add_course_submitting' : ''}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="add_course_spinner"></span>
                                        Creating Course...
                                    </>
                                ) : (
                                    "Create Course"
                                )}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AddCoursePage;