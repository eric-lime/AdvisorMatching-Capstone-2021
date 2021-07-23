const BitSet = require('fast-bitset');
const hungarian = require('../hungarian-on3');
const fs = require('fs');

class Advisor {
    name;
    department;
    strengths;
    internationalStudentInterest;
}

class Student {
    name;
    departments;
    needs;
    isInternationalStudent;
}

module.exports = class scorer{
  constructor(advisor_file, student_file, input_weights){
    this.advisor_file = advisor_file;
    this.student_file = student_file;
    this.advisors = [];
    this.students = [];
    
    //Read advisors.csv
    const advisor_row = fs.readFileSync(advisor_file).toString().split("\n");
    for(var i = 1; i < advisor_row.length; i++){
//        console.log(advisor_row[i].length);
        if(advisor_row[i].length > 1){
          this.advisors[i - 1] = advisor_row[i].split(",");
        }
    }

    //Read students.csv
    const student_row = fs.readFileSync(student_file).toString().split("\n");
    for(i = 1; i < student_row.length; i++){
//        console.log(student_row[i].length);
        if(student_row[i].length > 1){
          this.students[i - 1] = student_row[i].split(",");
        }
    }
    
    this.num_students = this.students.length;
    this.num_advisors = this.advisors.length;

    this.student_array = [];
    this.advisor_array = [];

    this.col_student_needs = 4;
    this.col_student_departments = 3;
    this.col_student_international = 2;
    this.col_student_name = 1;

    this.col_advisor_capacity = 10;
    this.col_advisor_strengths = 4;
    this.col_advisor_department = 3;
    this.col_advisor_international = 2;
    this.col_advisor_name = 1;
    
    this.weights = input_weights;
    console.log(this.weights);
    
    //students are rows, advisors are columns
    this.cost_matrix = [];
    this.results = [];
  }
  
  //Assume students is multidimensional array, with each row representing a student
  //Assume advisors is multidimensional array, with each row representing an advisors

  fill_student_array(){
    for (var i = 0; i < this.num_students; i++) {
      var student = new Student();
      student.departments = this.students[i][this.col_student_departments];
      //Student needs
      student.needs = this.students[i][this.col_student_needs].split(";");

      for (var j = 0; j < student.needs.length; j++) {
        if (student.needs[j].replace('"', '') == 'choosing and planning classes') {
          student.needs[j] = "A";
        }
        if (student.needs[j].replace('"', '') == 'picking a major/discovering interests') {
          student.needs[j] = "B";
        }
        if (student.needs[j].replace('"', '') == 'adjusting to the difficulty of college level academic courses') {
          student.needs[j] = "C";
        }
        if (student.needs[j].replace('"', '') == 'helping manage non-academic stress and problems') {
          student.needs[j] = "D";
        }
      }
      student.isInternationalStudent = this.students[i][this.col_student_international];
      student.name = this.students[i][this.col_student_name];
      this.student_array.push(student);
    }
  }


  fill_advisor_array(){
    for (var i = 0; i < this.num_advisors; i++) {
      for (var k = 0; k < this.advisors[i][this.col_advisor_capacity]; k++) {
        var advisor = new Advisor();
        advisor.department = this.advisors[i][this.col_advisor_department];
        //Advisor strengths
        advisor.strengths = this.advisors[i][this.col_advisor_strengths].split(";");
        for (var j = 0; j < advisor.strengths.length; j++) {
          if (advisor.strengths[j].replace('"', '') == "helping a student plan classes") {
            advisor.strengths[j] = "A";
          }
          if (advisor.strengths[j].replace('"', '') == "helping a student decide a major and develop their interests") {
            advisor.strengths[j] = "B";
          }
          if (advisor.strengths[j].replace('"', '') == "helping students with academic skills") {
            advisor.strengths[j] = "C";
          }
          if (advisor.strengths[j].replace('"', '') == "helping a student manage non-academic stress and being a source of general support") {
            advisor.strengths[j] = "D";
          }
        }
        advisor.internationalStudentInterest = this.advisors[i][this.col_advisor_international];
        advisor.name = this.advisors[i][this.col_advisor_name];
        this.advisor_array.push(advisor);
      }
    }
  }

  calculate_individual_score(student, advisor) {
    var score = 0;
    //Student needs/advisor strengths
    for (var i = 0; i < student.needs.length; i++) {
      for (var j = 0; j < advisor.strengths.length; j++) {
        if (student.needs[i] == advisor.strengths[j]) {
          score += this.weights[0];
        }
      }
    }
    //International student
    if (student.isInternationalStudent == "Yes" && advisor.internationalStudentInterest == "International") {
      score += this.weights[1];
    }
    //Department
    if (student.departments == advisor.department) {
      score += this.weights[2];
    }
    return score;
  }

  
//  Solves the assignment problem (optimal matching for a directed bipartite graph)
// * @param {Array} costMatrix an array of arrays where a[n][m] is the cost of assigning job m to worker n
// * @param {boolean} [isProfit] solves the AP by maximizing the costs
// * @returns {Array} An array of arrays. a[0] = worker index. a[1] = job index (or -1 if unassigned)
  calculate_score(){
    for (var i in this.student_array) {
      var cost_matrix_row = [];
      for (var j in this.advisor_array) {
        var score = this.calculate_individual_score(this.student_array[i], this.advisor_array[j]);
        cost_matrix_row.push(score);
      }
      this.cost_matrix.push(cost_matrix_row);
    }
    console.log(this.cost_matrix);
  }
  
  calculate_results(){
    this.results = hungarian(this.cost_matrix, true);
  }
  
  get_results(){
    for(var i = 0; i < this.results.length; i++){
      this.results[i][0] = this.student_array[this.results[i][0]].name;
      this.results[i][1] = this.advisor_array[this.results[i][1]].name;
    }
    return this.results;
  }
}
