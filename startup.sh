service apache2 start
sudo chmod a+x /opt/pythonServer/index.py
source /opt/pythonServer/flask/bin/activate
python /opt/pythonServer/index.py & ./opt/janus/bin/janus


