const API_BASE_URL = 'https://backend-krishnas-projects-7d6accd9.vercel.app/api';

const testApp = async () => {
  const timestamp = Date.now();
  const testUser = {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'StrongPassword@123!',
  };

  let token = '';
  let taskId = '';
  let routineId = '';

  console.log('--- Starting E2E Tests ---');
  console.log(`Using Base URL: ${API_BASE_URL}\n`);

  try {
    // 1. Signup
    console.log('1. Testing Signup...');
    const signupRes = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (signupRes.status === 201) {
      console.log('✅ Signup successful');
    } else {
      const dataText = await signupRes.text();
      throw new Error(`Signup failed: ${dataText}`);
    }

    // 2. Login
    console.log('2. Testing Login...');
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const loginData = await loginRes.json();
    let cookie = '';
    const setCookieHeader = loginRes.headers.get('set-cookie');
    if (loginRes.status === 200 && setCookieHeader) {
      // Very basic extraction for the 'token' cookie
      const match = setCookieHeader.match(/token=([^;]+)/);
      if (match) {
        token = match[1];
        cookie = `token=${token}`;
        console.log('✅ Login successful. Token cookie received.');
      } else {
        throw new Error(`Login failed: No token in cookie. Header: ${setCookieHeader}`);
      }
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const authHeaders = { 
      'Content-Type': 'application/json',
      'Cookie': cookie
    };

    // 3. Create Task
    console.log('3. Testing Task Creation...');
    const taskData = {
      title: 'E2E Test Task',
      description: 'This is a test task',
      tags: ['test'],
      priority: 'High',
      status: 'Due',
      dueDate: new Date().toISOString(),
    };
    const taskRes = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(taskData)
    });
    const taskResData = await taskRes.json();
    if (taskRes.status === 201 && taskResData.newTask) {
      taskId = taskResData.newTask._id;
      console.log(`✅ Task creation successful (ID: ${taskId})`);
    } else {
      throw new Error(`Task creation failed: ${JSON.stringify(taskResData)}`);
    }

    // 4. Update Task
    console.log('4. Testing Task Update...');
    const updateRes = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Completed', actualDuration: 30 })
    });
    if (updateRes.status === 200) {
      console.log('✅ Task update successful');
    } else {
      const updateData = await updateRes.json();
      throw new Error(`Task update failed: ${JSON.stringify(updateData)}`);
    }

    // 5. Create Routine
    console.log('5. Testing Routine Creation...');
    const routineData = {
      name: 'E2E Test Routine',
      description: 'Test routine description',
      items: [
        {
          taskId: taskId,
          day: 'Monday',
          startTime: 480,
          duration: 60,
        }
      ]
    };
    const routineRes = await fetch(`${API_BASE_URL}/routines`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(routineData)
    });
    const routineResData = await routineRes.json();
    if (routineRes.status === 201 && routineResData.routine) {
      routineId = routineResData.routine._id;
      console.log(`✅ Routine creation successful (ID: ${routineId})`);
    } else {
      throw new Error(`Routine creation failed: ${JSON.stringify(routineResData)}`);
    }

    // 6. Test Debt Dashboard
    console.log('6. Testing Debt Dashboard API...');
    const debtRes = await fetch(`${API_BASE_URL}/debt/dashboard`, {
      method: 'GET',
      headers: authHeaders
    });
    const debtData = await debtRes.json();
    if (debtRes.status === 200 && debtData.success) {
      console.log('✅ Debt Dashboard fetched successfully.');
      console.log('   Today Metrics:', debtData.today);
    } else {
      throw new Error(`Debt Dashboard failed: ${JSON.stringify(debtData)}`);
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY 🎉');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(error.message);
  }
};

testApp();
